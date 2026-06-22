"""
Assembles everything the agent needs into a single dict.
This is what gets serialised into the Claude system prompt.
"""
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent / ".env")

GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar"]
HIGHSTAKES_KEYWORDS = ["exam", "final", "midterm", "quiz", "deadline", "due", "presentation", "interview", "demo"]

TONE_DESCRIPTIONS = {
    "tough_love": "direct and blunt — no excuses, no softening. Push them.",
    "gentle":     "warm and understanding, but still firm. Don't let them off the hook.",
    "coach":      "strategic and motivational. Help them see the bigger picture.",
}


def _resolve_week_schedule(data: dict, week_key: str) -> dict:
    """Return the {day: {hour: type}} schedule for a specific week.

    Supports both the old flat format (day indices as top-level keys)
    and the new week-keyed format (YYYY-MM-DD keys with a "template" fallback).
    """
    if not data:
        return {}
    # Old format: top-level keys are "0"-"6"
    if any(k in data for k in ["0", "1", "2", "3", "4", "5", "6"]):
        return data
    # New format: week-specific key, falling back to template
    return data.get(week_key) or data.get("template", {})


async def build(
    pool,
    user_id: str,
    app_triggered: str,
    battery: Optional[int],
    location: Optional[str],
) -> dict:
    # ── User profile ──
    user = await pool.fetchrow(
        "SELECT identity_statement, agent_tone, hobby_profile, schedule, google_refresh_token FROM users WHERE id = $1",
        user_id,
    )

    hobby_profile  = json.loads(user["hobby_profile"]) if isinstance(user["hobby_profile"], str) else (user["hobby_profile"] or {})
    full_schedule  = json.loads(user["schedule"])      if isinstance(user["schedule"],      str) else (user["schedule"]      or {})
    now_local_pre  = datetime.now().astimezone()
    week_key       = (now_local_pre - timedelta(days=now_local_pre.weekday())).strftime("%Y-%m-%d")
    schedule       = _resolve_week_schedule(full_schedule, week_key)

    top_hobbies = sorted(hobby_profile.items(), key=lambda x: -x[1])[:3]
    hobby_lines = [f"  - {k.replace('_', ' ').title()} (weight {round(v*100)}%)" for k, v in top_hobbies]

    # ── Schedule block right now ──
    now_local    = datetime.now().astimezone()
    day_idx      = str(now_local.weekday())   # 0=Mon
    current_hour = str(now_local.hour)
    schedule_block = schedule.get(day_idx, {}).get(current_hour)  # "focus"|"leisure"|None

    # ── Calendar ──
    upcoming_events: list = []
    highstakes: Optional[dict] = None
    refresh_token = user["google_refresh_token"] or ""
    if refresh_token and not refresh_token.startswith("1//fake"):
        try:
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request
            from googleapiclient.discovery import build as gcal_build
            creds = Credentials(
                token=None, refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=os.getenv("GOOGLE_CLIENT_ID"),
                client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
                scopes=GOOGLE_SCOPES,
            )
            if not creds.valid:
                creds.refresh(Request())
            service = gcal_build("calendar", "v3", credentials=creds, cache_discovery=False)
            now_utc = datetime.now(timezone.utc)
            result  = service.events().list(
                calendarId="primary",
                timeMin=now_utc.isoformat(),
                timeMax=(now_utc + timedelta(days=14)).isoformat(),
                singleEvents=True,
                orderBy="startTime",
                maxResults=50,
            ).execute()
            for ev in result.get("items", []):
                start_raw = ev["start"].get("dateTime", ev["start"].get("date"))
                end_raw   = ev["end"].get("dateTime",   ev["end"].get("date"))
                start_dt  = datetime.fromisoformat(start_raw.replace("Z", "+00:00")).astimezone()
                end_dt    = datetime.fromisoformat(end_raw.replace("Z", "+00:00")).astimezone()
                hours_away = (start_dt - datetime.now().astimezone()).total_seconds() / 3600
                entry = {
                    "title":      ev.get("summary", "Busy"),
                    "date":       start_dt.strftime("%Y-%m-%d"),
                    "day_name":   start_dt.strftime("%A"),
                    "start_time": start_dt.strftime("%H:%M"),
                    "end_time":   end_dt.strftime("%H:%M"),
                    "hours_away": round(hours_away, 1),
                }
                upcoming_events.append(entry)
                if not highstakes and any(k in ev.get("summary", "").lower() for k in HIGHSTAKES_KEYWORDS):
                    highstakes = entry
        except Exception:
            pass

    # ── Recent session history ──
    recent = await pool.fetch(
        """
        SELECT outcome, app_triggered, DATE(created_at) AS day
        FROM sessions
        WHERE user_id = $1
        ORDER BY created_at DESC LIMIT 10
        """,
        user_id,
    )
    recent_outcomes = [r["outcome"] for r in recent if r["outcome"]]

    # opens on this app today
    opens_today = sum(
        1 for r in recent
        if r["app_triggered"] == app_triggered and r["day"] == now_local.date()
    )

    # ── Vulnerability score ──
    from agent import vulnerability as vuln_mod
    vuln_score = vuln_mod.compute(
        battery=battery,
        schedule_block=schedule_block,
        exam_hours_away=highstakes["hours_away"] if highstakes else None,
        opens_today=opens_today,
        recent_outcomes=recent_outcomes,
    )

    return {
        # raw data for DB writes
        "user_id":        user_id,
        "app_triggered":  app_triggered,
        "battery":        battery,
        "location":       location,
        "vuln_score":     vuln_score,
        "vuln_label":     vuln_mod.label(vuln_score),
        "schedule_block": schedule_block,
        "opens_today":    opens_today,
        "recent_outcomes": recent_outcomes,
        "highstakes":     highstakes,
        # formatted for the system prompt
        "identity":       user["identity_statement"] or "a person trying to build better habits",
        "agent_tone":     user["agent_tone"] or "tough_love",
        "tone_desc":      TONE_DESCRIPTIONS.get(user["agent_tone"] or "tough_love", ""),
        "hobby_lines":    hobby_lines,
        "schedule_label": (
            f"currently in a scheduled **{schedule_block}** block"
            if schedule_block else "unscheduled time"
        ),
        "google_refresh_token": refresh_token if (refresh_token and not refresh_token.startswith("1//fake")) else None,
        "calendar_connected": bool(refresh_token and not refresh_token.startswith("1//fake")),
        "calendar_lines": _calendar_lines(upcoming_events, highstakes),
        "today_schedule_summary": _today_schedule_summary(schedule, now_local),
        "week_schedule_summary":  _week_schedule_summary(schedule),
        "week_dates":             _week_dates(now_local),
        "recent_behavior": _behavior_summary(recent_outcomes, opens_today, app_triggered),
        "time_label":     _time_label(now_local),
        "day_label":      now_local.strftime("%A"),
        "today_date":     now_local.strftime("%Y-%m-%d"),
        "tomorrow_date":  (now_local + timedelta(days=1)).strftime("%Y-%m-%d"),
    }


_DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

def _week_schedule_summary(schedule: dict) -> str:
    """Format the full weekly routine for the agent (all 7 days)."""
    lines = []
    for day_idx, day_name in enumerate(_DAY_NAMES):
        day_blocks = schedule.get(str(day_idx), {})
        if not day_blocks:
            continue
        focus_hours   = sorted(int(h) for h, t in day_blocks.items() if t == "focus")
        leisure_hours = sorted(int(h) for h, t in day_blocks.items() if t == "leisure")

        def to_ranges(hours):
            if not hours: return []
            ranges, start, end = [], hours[0], hours[0]
            for h in hours[1:]:
                if h == end + 1: end = h
                else:
                    ranges.append((start, end + 1)); start = end = h
            ranges.append((start, end + 1))
            return ranges

        def fmt(h):
            if h == 0: return "12am"
            if h < 12: return f"{h}am"
            if h == 12: return "12pm"
            return f"{h-12}pm"

        parts = []
        if focus_hours:
            parts.append("focus " + "/".join(f"{fmt(s)}-{fmt(e)}" for s, e in to_ranges(focus_hours)))
        if leisure_hours:
            parts.append("leisure " + "/".join(f"{fmt(s)}-{fmt(e)}" for s, e in to_ranges(leisure_hours)))
        if parts:
            lines.append(f"{day_name}: {', '.join(parts)}")
    return "\n".join(lines) if lines else "no routine blocks set"


def _week_dates(now_local: datetime) -> str:
    """Return the actual date for each day of the current week."""
    monday = now_local - timedelta(days=now_local.weekday())
    names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return ", ".join(
        f"{name}={( monday + timedelta(days=i)).strftime('%Y-%m-%d')}"
        for i, name in enumerate(names)
    )


def _time_label(dt: datetime) -> str:
    h = dt.hour
    minute = dt.strftime("%M")
    hour12 = h % 12 or 12
    ampm = "AM" if h < 12 else "PM"
    period = "morning" if h < 12 else "afternoon" if h < 17 else "evening" if h < 21 else "night"
    return f"{hour12}:{minute} {ampm} ({period})"


def _today_schedule_summary(schedule: dict, now_local: datetime) -> str:
    """Format today's focus/leisure blocks as human-readable time ranges."""
    day_idx = str(now_local.weekday())
    today_blocks = schedule.get(day_idx, {})
    if not today_blocks:
        return "no focus or leisure blocks set today"

    focus_hours   = sorted(int(h) for h, t in today_blocks.items() if t == "focus")
    leisure_hours = sorted(int(h) for h, t in today_blocks.items() if t == "leisure")

    def to_ranges(hours):
        if not hours:
            return []
        ranges, start, end = [], hours[0], hours[0]
        for h in hours[1:]:
            if h == end + 1:
                end = h
            else:
                ranges.append((start, end + 1))
                start = end = h
        ranges.append((start, end + 1))
        return ranges

    def fmt(h):
        if h == 0:  return "12am"
        if h < 12:  return f"{h}am"
        if h == 12: return "12pm"
        return f"{h - 12}pm"

    parts = []
    if focus_hours:
        parts.append("Focus: " + ", ".join(f"{fmt(s)}-{fmt(e)}" for s, e in to_ranges(focus_hours)))
    if leisure_hours:
        parts.append("Leisure: " + ", ".join(f"{fmt(s)}-{fmt(e)}" for s, e in to_ranges(leisure_hours)))
    return " | ".join(parts)


def _calendar_lines(events: list, highstakes: Optional[dict]) -> str:
    if not events:
        return "No events in the next 14 days."
    lines = []
    if highstakes:
        lines.append(f"⚠ HIGH STAKES: \"{highstakes['title']}\" on {highstakes['day_name']} {highstakes['date']} {highstakes['start_time']}–{highstakes['end_time']}")
    for ev in events[:12]:
        if ev is not highstakes:
            lines.append(f"  - {ev['day_name']} {ev['date']} {ev['start_time']}–{ev['end_time']}: {ev['title']}")
    return "\n".join(lines)


def _behavior_summary(outcomes: list, opens_today: int, app: str) -> str:
    parts = []
    if opens_today > 1:
        parts.append(f"This is the {opens_today}{'rd' if opens_today==3 else 'th' if opens_today>3 else 'nd'} time opening {app} today")
    overrides = sum(1 for o in outcomes[:5] if o == "overridden")
    if overrides:
        parts.append(f"ignored the agent {overrides} time(s) recently")
    redirected = sum(1 for o in outcomes[:5] if o == "redirected")
    if redirected:
        parts.append(f"accepted {redirected} redirect(s) recently")
    return "; ".join(parts) if parts else "no notable recent pattern"
