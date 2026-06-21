import json
from fastapi import APIRouter, Query
from db import get_pool

router = APIRouter()
DEFAULT_USER = "00000000-0000-0000-0000-000000000001"

APP_ICONS = {
    "tiktok.com":    "ti-brand-tiktok",
    "instagram.com": "ti-brand-instagram",
    "reddit.com":    "ti-brand-reddit",
    "twitter.com":   "ti-brand-twitter",
    "youtube.com":   "ti-brand-youtube",
}


@router.get("/interventions")
async def list_interventions(
    user_id: str = Query(default=DEFAULT_USER),
    limit:   int = Query(default=50),
):
    pool = await get_pool()

    rows = await pool.fetch(
        """
        SELECT
            i.id,
            i.accepted,
            i.messages,
            i.redirect_suggestion,
            i.created_at,
            s.app_triggered,
            s.vulnerability_score,
            s.outcome,
            s.battery,
            s.location
        FROM interventions i
        JOIN sessions s ON s.id = i.session_id
        WHERE i.user_id = $1
        ORDER BY i.created_at DESC
        LIMIT $2
        """,
        user_id, limit,
    )

    items = []
    for r in rows:
        messages = r["messages"]
        if isinstance(messages, str):
            messages = json.loads(messages)

        suggestion = r["redirect_suggestion"]
        if isinstance(suggestion, str):
            suggestion = json.loads(suggestion) if suggestion else None

        app = r["app_triggered"] or "unknown"
        outcome = r["outcome"]

        items.append({
            "id":                str(r["id"]),
            "created_at":        r["created_at"].isoformat(),
            "app":               app,
            "app_icon":          APP_ICONS.get(app, "ti-device-mobile"),
            "vulnerability_score": r["vulnerability_score"],
            "outcome":           outcome,
            "accepted":          r["accepted"],
            "battery":           r["battery"],
            "location":          r["location"],
            "messages":          messages or [],
            "redirect_suggestion": suggestion,
        })

    # summary stats
    total     = len(items)
    accepted  = sum(1 for i in items if i["accepted"])
    overridden = sum(1 for i in items if i["outcome"] == "overridden")
    accept_rate = round(100 * accepted / total) if total else 0

    return {
        "items": items,
        "total": total,
        "accepted": accepted,
        "overridden": overridden,
        "accept_rate": accept_rate,
    }
