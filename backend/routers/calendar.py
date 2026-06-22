import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Query
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from dotenv import load_dotenv
from db import get_pool

load_dotenv(Path(__file__).parent.parent.parent / ".env")

router = APIRouter()
DEFAULT_USER = "00000000-0000-0000-0000-000000000001"
SCOPES = ["https://www.googleapis.com/auth/calendar"]


def _creds(refresh_token: str) -> Credentials:
    return Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES,
    )


@router.get("/calendar/events")
async def get_calendar_events(
    user_id: str = Query(default=DEFAULT_USER),
    week_start: str = Query(default=None),  # YYYY-MM-DD; defaults to current Monday
):
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT google_refresh_token FROM users WHERE id = $1", user_id
    )

    token = row["google_refresh_token"] if row else None
    if not token or token.startswith("1//fake"):
        return {"connected": False, "events": []}

    try:
        creds = _creds(token)
        if not creds.valid:
            creds.refresh(Request())

        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        if week_start:
            ws = datetime.fromisoformat(week_start).replace(tzinfo=timezone.utc)
        else:
            now = datetime.now(timezone.utc)
            ws = (now - timedelta(days=now.weekday())).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        week_end = ws + timedelta(days=7)

        result = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=ws.isoformat(),
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
                start_dt = datetime.fromisoformat(start_raw.replace("Z", "+00:00")).astimezone()
                end_dt   = datetime.fromisoformat(end_raw.replace("Z", "+00:00")).astimezone()
                end_hour = end_dt.hour if end_dt.minute == 0 else end_dt.hour + 1
                events.append({
                    "title":      ev.get("summary", "Busy"),
                    "day":        start_dt.weekday(),   # 0=Mon
                    "start_hour": start_dt.hour,
                    "end_hour":   end_hour,
                })
            except Exception:
                continue

        return {"connected": True, "events": events}

    except Exception as e:
        return {"connected": False, "events": [], "error": str(e)}
