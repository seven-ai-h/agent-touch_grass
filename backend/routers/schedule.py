import json
from fastapi import APIRouter, Query
from pydantic import BaseModel
from db import get_pool

router = APIRouter()

DEFAULT_USER = "00000000-0000-0000-0000-000000000001"


class ScheduleSaveRequest(BaseModel):
    schedule: dict


def _is_old_format(data: dict) -> bool:
    """Old format has day indices ("0"-"6") as top-level keys."""
    return any(k in data for k in ["0", "1", "2", "3", "4", "5", "6"])


def _get_week(data: dict, week_start: str) -> dict:
    """Return the schedule for a specific week, falling back to template."""
    if _is_old_format(data):
        return data
    return data.get(week_start) or data.get("template", {})


def _save_week(data: dict, week_start: str, grid: dict) -> dict:
    """Merge a week-specific grid into the full schedule dict."""
    if _is_old_format(data):
        # Migrate: preserve old data as the repeating template
        data = {"template": data}
    data[week_start] = grid
    return data


@router.get("/schedule")
async def get_schedule(
    user_id: str = Query(default=DEFAULT_USER),
    week_start: str = Query(default=None),
):
    pool = await get_pool()
    row = await pool.fetchrow("SELECT schedule FROM users WHERE id = $1", user_id)
    if not row:
        return {}
    raw = row["schedule"]
    data = json.loads(raw) if isinstance(raw, str) else (raw or {})
    if week_start:
        return _get_week(data, week_start)
    return data


@router.put("/schedule")
async def save_schedule(
    body: ScheduleSaveRequest,
    user_id: str = Query(default=DEFAULT_USER),
    week_start: str = Query(default=None),
):
    pool = await get_pool()

    if week_start:
        # Load existing, merge this week in, save back
        row = await pool.fetchrow("SELECT schedule FROM users WHERE id = $1", user_id)
        raw = row["schedule"] if row else None
        existing = json.loads(raw) if isinstance(raw, str) else (raw or {})
        updated = _save_week(existing, week_start, body.schedule)
        await pool.execute(
            "UPDATE users SET schedule = $1 WHERE id = $2",
            json.dumps(updated), user_id,
        )
    else:
        # Legacy: replace entire schedule
        await pool.execute(
            "UPDATE users SET schedule = $1 WHERE id = $2",
            json.dumps(body.schedule), user_id,
        )
    return {"ok": True}
