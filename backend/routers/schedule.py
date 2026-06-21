import json
from fastapi import APIRouter, Query
from pydantic import BaseModel
from db import get_pool

router = APIRouter()

DEFAULT_USER = "00000000-0000-0000-0000-000000000001"


class ScheduleSaveRequest(BaseModel):
    schedule: dict


@router.get("/schedule")
async def get_schedule(user_id: str = Query(default=DEFAULT_USER)):
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT schedule FROM users WHERE id = $1", user_id
    )
    if not row:
        return {}
    raw = row["schedule"]
    return json.loads(raw) if isinstance(raw, str) else (raw or {})


@router.put("/schedule")
async def save_schedule(
    body: ScheduleSaveRequest,
    user_id: str = Query(default=DEFAULT_USER),
):
    pool = await get_pool()
    await pool.execute(
        "UPDATE users SET schedule = $1 WHERE id = $2",
        json.dumps(body.schedule),
        user_id,
    )
    return {"ok": True}
