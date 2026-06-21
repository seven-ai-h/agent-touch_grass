import json
import os
import asyncio
from functools import partial
from typing import Optional
from fastapi import APIRouter, Query
from datetime import date, timedelta, datetime, timezone
from db import get_pool

GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
HIGHSTAKES_KEYWORDS = ["exam", "final", "midterm", "quiz", "deadline", "due", "presentation", "interview", "demo"]


def _upcoming_highstakes(refresh_token: str) -> Optional[dict]:
    """Return the nearest high-stakes calendar event within 48h, or None."""
    if not refresh_token or refresh_token.startswith("1//fake"):
        return None
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
        creds = Credentials(
            token=None, refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=GOOGLE_SCOPES,
        )
        if not creds.valid:
            creds.refresh(Request())
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        now = datetime.now(timezone.utc)
        result = service.events().list(
            calendarId="primary",
            timeMin=now.isoformat(),
            timeMax=(now + timedelta(hours=48)).isoformat(),
            singleEvents=True,
            orderBy="startTime",
        ).execute()
        for ev in result.get("items", []):
            title = ev.get("summary", "").lower()
            if any(k in title for k in HIGHSTAKES_KEYWORDS):
                start_raw  = ev["start"].get("dateTime", ev["start"].get("date"))
                start_dt   = datetime.fromisoformat(start_raw.replace("Z", "+00:00"))
                hours_away = (start_dt - now).total_seconds() / 3600
                return {"title": ev.get("summary"), "hours_away": round(hours_away, 1)}
    except Exception:
        pass
    return None

router = APIRouter()

# default to Jamie for development — replace with real auth later
DEFAULT_USER = "00000000-0000-0000-0000-000000000001"


def vuln_label(dt: datetime, is_last: bool) -> str:
    if is_last:
        return "Now"
    h = dt.hour
    if h == 0:
        return "12am"
    if h < 12:
        return f"{h}am" if h == 8 else str(h)
    if h == 12:
        return "1pm" if False else "12pm"
    label = h - 12
    return f"{label}pm" if label == 1 else str(label)


def vuln_color(score: int, is_last: bool) -> str:
    if is_last:
        return "var(--vuln-now)"
    if score <= 40:
        return "var(--vuln-low)"
    if score <= 65:
        return "var(--vuln-mid)"
    return "var(--vuln-high)"


@router.get("/dashboard/stats")
async def get_stats(user_id: str = Query(default=DEFAULT_USER)):
    pool = await get_pool()

    # streak: consecutive days ending today with at least one redirect
    days = await pool.fetch("""
        SELECT DISTINCT DATE(created_at) AS day
        FROM sessions
        WHERE user_id = $1 AND outcome = 'redirected'
        ORDER BY day DESC
    """, user_id)

    streak = 0
    expected = date.today()
    for row in days:
        if row["day"] == expected:
            streak += 1
            expected -= timedelta(days=1)
        else:
            break

    # intervention rate: last 7 days
    rate_row = await pool.fetchrow("""
        SELECT
            COUNT(*) FILTER (WHERE outcome IN ('redirected', 'leisure_window')) AS complied,
            COUNT(*) AS total
        FROM sessions
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
    """, user_id)
    rate = round(100 * rate_row["complied"] / rate_row["total"]) if rate_row["total"] > 0 else 0

    # time saved today: each redirected session ≈ 20 min saved
    saved_row = await pool.fetchrow("""
        SELECT COUNT(*) FILTER (WHERE outcome = 'redirected') AS count
        FROM sessions
        WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE
    """, user_id)
    time_saved = round(saved_row["count"] * 20 / 60, 1)

    # dopamine score: most recent vulnerability score
    score_row = await pool.fetchrow("""
        SELECT score FROM vulnerability_scores
        WHERE user_id = $1
        ORDER BY recorded_at DESC LIMIT 1
    """, user_id)
    dopamine = score_row["score"] if score_row else 0

    return {
        "streak": streak,
        "intervention_rate": rate,
        "time_saved_today": time_saved,
        "dopamine_score": dopamine,
    }


@router.get("/dashboard/vulnerability")
async def get_vulnerability(user_id: str = Query(default=DEFAULT_USER)):
    pool = await get_pool()
    rows = await pool.fetch("""
        SELECT score, recorded_at
        FROM vulnerability_scores
        WHERE user_id = $1 AND recorded_at > NOW() - INTERVAL '24 hours'
        ORDER BY recorded_at ASC
    """, user_id)

    result = []
    for i, row in enumerate(rows):
        is_last = i == len(rows) - 1
        result.append({
            "label": vuln_label(row["recorded_at"], is_last),
            "score": row["score"],
            "color": vuln_color(row["score"], is_last),
            "isNow": is_last,
        })
    return result


@router.get("/dashboard/gap")
async def get_gap(user_id: str = Query(default=DEFAULT_USER)):
    pool = await get_pool()

    user = await pool.fetchrow(
        "SELECT hobby_profile FROM users WHERE id = $1", user_id
    )
    if not user or not user["hobby_profile"]:
        return []

    hobbies = json.loads(user["hobby_profile"])  # {"basketball": 0.34, ...}

    # accepted redirects this week grouped by hobby
    redirects = await pool.fetch("""
        SELECT redirect_suggestion->>'hobby' AS hobby, COUNT(*) AS count
        FROM interventions
        WHERE user_id = $1
          AND accepted = true
          AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY redirect_suggestion->>'hobby'
    """, user_id)
    did_map = {row["hobby"]: row["count"] for row in redirects}

    result = []
    for key, weight in sorted(hobbies.items(), key=lambda x: -x[1]):
        label = key.replace("_", " ").title()
        watched = round(weight * 7, 1)          # weight * 7h ≈ daily content consumed
        did = round(did_map.get(key, 0) * 0.5, 1)  # each accepted redirect ≈ 30 min
        result.append({
            "hobby": label,
            "watched_hours": watched,
            "did_hours": did,
            "watched_pct": min(int(weight * 230), 100),  # scale for bar width
            "did_pct": min(int(did_map.get(key, 0) * 15), 100),
        })
    return result


@router.get("/dashboard/suggestions")
async def get_suggestions(user_id: str = Query(default=DEFAULT_USER)):
    pool = await get_pool()

    user = await pool.fetchrow(
        "SELECT hobby_profile, identity_statement, google_refresh_token FROM users WHERE id = $1", user_id
    )
    if not user or not user["hobby_profile"]:
        return []

    hobbies = json.loads(user["hobby_profile"])
    top = sorted(hobbies.items(), key=lambda x: -x[1])[:3]

    # check calendar for upcoming high-stakes events (blocking call → threadpool)
    loop = asyncio.get_event_loop()
    highstakes = await loop.run_in_executor(
        None, partial(_upcoming_highstakes, user["google_refresh_token"] or "")
    )

    themes = [
        {"bg": "var(--green-light)",   "border": "var(--green-card-border)",  "tagColor": "var(--green)",           "btnBg": "var(--green)"},
        {"bg": "var(--amber-card-bg)", "border": "var(--amber-card-border)",  "tagColor": "var(--amber-badge-text)","btnBg": "var(--amber)"},
        {"bg": "var(--lavender)",      "border": "var(--purple-card-border)", "tagColor": "var(--purple)",          "btnBg": "var(--purple)"},
    ]

    # when something high-stakes is within 12h, replace the first card with a study/prep nudge
    if highstakes and highstakes["hours_away"] <= 12:
        h = round(highstakes["hours_away"], 1)
        exam_card = {
            **{"bg": "var(--red-warning-bg)", "border": "#FECACA", "tagColor": "var(--red)", "btnBg": "var(--red)"},
            "tag":     highstakes["title"],
            "title":   f"{h}h away — focus up",
            "desc":    f"You have {highstakes['title']} in {h} hours. TikTok can wait. Review your notes for 25 minutes, then take a real break.",
            "btnText": "Start focus session",
            "highstakes": True,
        }
        # still offer a short break as second card (first hobby)
        key, _ = top[0]
        label  = key.replace("_", " ").title()
        break_copy = {
            "basketball":       ("Short break first?", f"20 min at Willard Park before your final review. Clear your head, then lock in.", "Get moving"),
            "running":          ("Short break first?", "20 min run to reset. You've earned it — then back to work.", "Let's run"),
            "music_production": ("5-min reset",        "Play something, just to decompress. Then close the DAW.", "Quick session"),
            "cooking":          ("Eat something",      "You probably haven't eaten. Make something fast, then get back to it.", "Find recipe"),
        }
        b_title, b_desc, b_btn = break_copy.get(key, ("Take a short break", f"20 minutes of {label.lower()}, then back to work.", "Let's go"))
        break_card = {
            **themes[1],
            "tag": label, "title": b_title, "desc": b_desc, "btnText": b_btn,
        }
        return [exam_card, break_card]

    # normal hobby suggestions
    copy = {
        "basketball":       ("Willard Park",         "0.4mi away, open until 10pm. Work on your weak-hand layup.", "Get directions"),
        "music_production": ("Open your project",    "6 days since your last session. Set a 20-min timer.",        "Open Ableton"),
        "cooking":          ("Make something quick", "You haven't cooked in 3 days. 20-min recipe, no excuses.",   "Find recipe"),
        "running":          ("Go for a run",         "You're at home. 20 minutes outside resets everything.",      "Start run"),
        "reading":          ("Read for 20 min",      "Pick up where you left off. No phone, just the book.",       "Open book"),
        "drawing":          ("Sketch something",     "5 minutes of drawing beats 30 minutes of scrolling.",        "Open sketchbook"),
        "hiking":           ("Trail nearby",         "Weather looks good. Even a 20-min walk counts.",             "Find trail"),
        "photography":      ("Go shoot something",   "You haven't taken photos in a week. Go outside.",            "Open camera"),
        "guitar":           ("Play for 15 min",      "Put on a backing track and just play. No pressure.",         "Open tabs"),
        "journaling":       ("Write it out",         "You've been on your phone for 2 hours. Write for 10 min.",   "Open journal"),
        "yoga":             ("10-min flow",          "Your body needs a reset more than this feed does.",          "Start flow"),
        "painting":         ("Paint something",      "Set a timer. Even 15 minutes counts as a session.",          "Open paints"),
        "coding_projects":  ("Work on your project", "30 focused minutes beats 2 hours of distracted browsing.",   "Open editor"),
    }

    result = []
    for i, (key, _) in enumerate(top):
        label = key.replace("_", " ").title()
        title, desc, btn = copy.get(key, (label, f"Do some {label.lower()} instead.", "Let's go"))
        # if high-stakes event is 12-24h away, prefix desc with a heads-up
        if highstakes and 12 < highstakes["hours_away"] <= 24:
            h = round(highstakes["hours_away"], 1)
            desc = f"{highstakes['title']} in {h}h — but a short break now helps. {desc}"
        result.append({**themes[i % len(themes)], "tag": label, "title": title, "desc": desc, "btnText": btn})
    return result
