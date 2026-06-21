import json
import os
from datetime import datetime, timedelta, timezone, date
from pathlib import Path
from fastapi import APIRouter, Query
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from dotenv import load_dotenv
from db import get_pool

load_dotenv(Path(__file__).parent.parent.parent / ".env")

router = APIRouter()
DEFAULT_USER = "00000000-0000-0000-0000-000000000001"
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]


def _creds(refresh_token: str) -> Credentials:
    return Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES,
    )


def _week_bounds():
    now = datetime.now(timezone.utc)
    start = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    end = start + timedelta(days=7)
    return start, end


def _week_label(start: datetime) -> str:
    end = start + timedelta(days=6)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    if start.month == end.month:
        return f"{months[start.month-1]} {start.day}–{end.day}"
    return f"{months[start.month-1]} {start.day} – {months[end.month-1]} {end.day}"


async def _fetch_calendar(refresh_token: str, week_start: datetime, week_end: datetime):
    if not refresh_token or refresh_token.startswith("1//fake"):
        return False, []
    try:
        creds = _creds(refresh_token)
        if not creds.valid:
            creds.refresh(Request())
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        result = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=week_start.isoformat(),
                timeMax=week_end.isoformat(),
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )
        events = []
        for ev in result.get("items", []):
            start_raw = ev["start"].get("dateTime", ev["start"].get("date"))
            end_raw   = ev["end"].get("dateTime",   ev["end"].get("date"))
            try:
                s = datetime.fromisoformat(start_raw.replace("Z", "+00:00")).astimezone()
                e = datetime.fromisoformat(end_raw.replace("Z", "+00:00")).astimezone()
                duration_h = round((e - s).total_seconds() / 3600, 2)
                events.append({
                    "title":    ev.get("summary", "Busy"),
                    "day":      s.weekday(),
                    "day_label": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][s.weekday()],
                    "start":    s.strftime("%-I:%M%p").lower(),
                    "end":      e.strftime("%-I:%M%p").lower(),
                    "duration_h": duration_h,
                })
            except Exception:
                continue
        return True, events
    except Exception:
        return False, []


@router.get("/report/weekly")
async def weekly_report(user_id: str = Query(default=DEFAULT_USER)):
    pool = await get_pool()
    week_start, week_end = _week_bounds()

    user = await pool.fetchrow(
        "SELECT google_refresh_token, schedule, hobby_profile FROM users WHERE id = $1", user_id
    )

    # ── Calendar ──
    token = user["google_refresh_token"] if user else None
    cal_connected, cal_events = await _fetch_calendar(token or "", week_start, week_end)
    total_cal_hours = round(sum(e["duration_h"] for e in cal_events), 1)

    # Group calendar events by day
    cal_by_day: dict[str, list] = {}
    for ev in cal_events:
        cal_by_day.setdefault(ev["day_label"], []).append(ev)

    # ── Schedule blocks ──
    raw_schedule = user["schedule"] if user else None
    schedule = json.loads(raw_schedule) if isinstance(raw_schedule, str) else (raw_schedule or {})
    focus_slots   = sum(1 for hrs in schedule.values() for t in hrs.values() if t == "focus")
    leisure_slots = sum(1 for hrs in schedule.values() for t in hrs.values() if t == "leisure")

    # ── Sessions this week ──
    sessions = await pool.fetch(
        """
        SELECT outcome, DATE(created_at) AS day
        FROM sessions
        WHERE user_id = $1 AND created_at >= $2 AND created_at < $3
        ORDER BY created_at
        """,
        user_id, week_start, week_end,
    )
    total_sessions   = len(sessions)
    redirected       = sum(1 for s in sessions if s["outcome"] == "redirected")
    leisure_window   = sum(1 for s in sessions if s["outcome"] == "leisure_window")
    overridden       = sum(1 for s in sessions if s["outcome"] == "overridden")
    time_saved_h     = round(redirected * 20 / 60, 1)
    comply_rate      = round(100 * (redirected + leisure_window) / total_sessions) if total_sessions else 0

    # sessions by day-of-week label
    DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    sessions_by_day: dict[str, dict] = {d: {"total": 0, "redirected": 0} for d in DAY_LABELS}
    for s in sessions:
        label = DAY_LABELS[s["day"].weekday()]
        sessions_by_day[label]["total"]     += 1
        if s["outcome"] == "redirected":
            sessions_by_day[label]["redirected"] += 1

    # ── Vulnerability avg this week ──
    vuln_rows = await pool.fetch(
        """
        SELECT score FROM vulnerability_scores
        WHERE user_id = $1 AND recorded_at >= $2 AND recorded_at < $3
        """,
        user_id, week_start, week_end,
    )
    vuln_avg = round(sum(r["score"] for r in vuln_rows) / len(vuln_rows)) if vuln_rows else None

    # ── Hobby gap (accepted redirects this week) ──
    hobbies_raw = user["hobby_profile"] if user else None
    hobbies = json.loads(hobbies_raw) if isinstance(hobbies_raw, str) else (hobbies_raw or {})
    redirects = await pool.fetch(
        """
        SELECT redirect_suggestion->>'hobby' AS hobby, COUNT(*) AS cnt
        FROM interventions
        WHERE user_id = $1 AND accepted = true
          AND created_at >= $2 AND created_at < $3
        GROUP BY redirect_suggestion->>'hobby'
        """,
        user_id, week_start, week_end,
    )
    did_map = {r["hobby"]: int(r["cnt"]) for r in redirects}

    hobby_gap = []
    for key, weight in sorted(hobbies.items(), key=lambda x: -x[1])[:4]:
        watched_h = round(weight * 7, 1)
        did_h     = round(did_map.get(key, 0) * 0.5, 1)
        hobby_gap.append({
            "hobby": key.replace("_", " ").title(),
            "watched_h": watched_h,
            "did_h": did_h,
            "gap_h": round(watched_h - did_h, 1),
        })

    return {
        "week_label":      _week_label(week_start),
        "cal_connected":   cal_connected,
        "cal_events":      cal_events,
        "cal_by_day":      cal_by_day,
        "total_cal_hours": total_cal_hours,
        "focus_slots":     focus_slots,
        "leisure_slots":   leisure_slots,
        "total_sessions":  total_sessions,
        "redirected":      redirected,
        "overridden":      overridden,
        "leisure_window":  leisure_window,
        "comply_rate":     comply_rate,
        "time_saved_h":    time_saved_h,
        "vuln_avg":        vuln_avg,
        "sessions_by_day": sessions_by_day,
        "hobby_gap":       hobby_gap,
    }
