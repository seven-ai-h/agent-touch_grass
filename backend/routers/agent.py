"""
POST /api/agent/chat  — RAG agent using Ollama (qwen2.5:3b) + Qdrant.

Live context (calendar, schedule, opens today, vuln score) comes from
context_bundle.build(). Qdrant provides supplementary RAG over user
profile data from the seed SQL for conversational queries.
"""
import re
import os
import json
import uuid
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter
from pydantic import BaseModel
import ollama as ollama_client
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct,
    Filter, FieldCondition, MatchValue,
)
from agent import context_bundle
from db import get_pool

router = APIRouter()

EMBEDDING_MODEL = "mxbai-embed-large"
LANGUAGE_MODEL  = "qwen2.5:3b"
COLLECTION      = "agent_schedule_sql"
SQL_FILE        = Path(__file__).parent.parent.parent / "db" / "002_seed.sql"

# Adjacent activity suggestions keyed by hobby keyword
_ADJACENT: dict = {
    "basketball":    ["hit the gym", "go for a run", "stretch for 10 min", "watch an NBA game", "try pickleball"],
    "music":         ["listen to a new album end-to-end", "find a local open mic", "learn one new chord", "organize your samples"],
    "production":    ["listen to a new album end-to-end", "find a local open mic", "learn one new chord", "organize your samples"],
    "friends":       ["text someone you haven't talked to in a week", "plan something for this weekend", "call instead of scrolling"],
    "hanging":       ["text someone you haven't talked to in a week", "plan something for this weekend", "call instead of scrolling"],
    "cooking":       ["try a recipe you've never made", "meal prep for the week", "visit a farmers market"],
    "reading":       ["read for 20 min", "find your next book", "re-read something you loved"],
    "gym":           ["do a 20-min home workout", "go for a walk", "stretch"],
    "running":       ["go for a short run", "try a new route", "do a walk if low energy"],
    "drawing":       ["sketch for 10 min", "study a reference image", "try a new medium"],
    "gaming":        ["play something offline", "take a full screen break", "try a board game"],
    "photography":   ["go shoot something outside", "edit your backlog", "try a new technique"],
    "writing":       ["free-write for 10 min", "journal about today", "work on something you've been putting off"],
}

def _adjacent_activities(hobby_lines: list) -> str:
    seen, out = set(), []
    for line in hobby_lines:
        name = line.lower()
        for key, activities in _ADJACENT.items():
            if key in name:
                for a in activities[:2]:
                    if a not in seen:
                        seen.add(a)
                        out.append(a)
                break
    if not out:
        out = ["go for a walk", "call a friend", "read for 20 min", "cook something new"]
    return ", ".join(out[:5])

_qdrant: Optional[QdrantClient] = None
_indexed = False


def _get_qdrant() -> QdrantClient:
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantClient(host="localhost", port=6333)
    return _qdrant


# ── SQL parsing ─────────────────────────────────────────────────────────────

def _split_sql_tuples(values_text: str) -> list:
    tuples, current, depth, in_string, i = [], [], 0, False, 0
    while i < len(values_text):
        char = values_text[i]
        current.append(char)
        if char == "'" and not (i + 1 < len(values_text) and values_text[i + 1] == "'"):
            in_string = not in_string
        elif not in_string:
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0:
                    tuples.append("".join(current).strip().rstrip(","))
                    current = []
        i += 1
    return tuples


def _extract_user_id(table: str, row_text: str) -> Optional[str]:
    ids = re.findall(r"'([0-9a-fA-F-]{36})'", row_text)
    try:
        return ids[0] if table == "users" else ids[1]
    except IndexError:
        return None


def _load_sql_chunks() -> list:
    sql = re.sub(r"--.*?$", "", SQL_FILE.read_text(), flags=re.MULTILINE)
    chunks = []
    for stmt in [s.strip() for s in sql.split(";") if s.strip()]:
        m = re.search(r"INSERT INTO\s+(\w+)\s*\(.*?\)\s*VALUES\s*(.*)", stmt, re.I | re.S)
        if not m:
            continue
        table = m.group(1)
        for row in _split_sql_tuples(m.group(2)):
            chunks.append({
                "table":   table,
                "user_id": _extract_user_id(table, row),
                "text":    f"TABLE: {table}\n\nROW:\n{row}",
            })
    return chunks


def _ensure_indexed():
    global _indexed
    if _indexed:
        return
    client = _get_qdrant()
    sample = ollama_client.embed(model=EMBEDDING_MODEL, input="hello")
    vector_size = len(sample["embeddings"][0])
    if not client.collection_exists(COLLECTION):
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
    if client.count(collection_name=COLLECTION).count == 0:
        points = []
        for i, chunk in enumerate(_load_sql_chunks()):
            emb = ollama_client.embed(model=EMBEDDING_MODEL, input=chunk["text"])["embeddings"][0]
            points.append(PointStruct(
                id=i, vector=emb,
                payload={"table": chunk["table"], "user_id": chunk["user_id"], "text": chunk["text"]},
            ))
        client.upsert(collection_name=COLLECTION, points=points)
    _indexed = True


def _retrieve(query: str, user_id: str, top_n: int = 4) -> list:
    client = _get_qdrant()
    q_emb = ollama_client.embed(model=EMBEDDING_MODEL, input=query)["embeddings"][0]
    results = client.query_points(
        collection_name=COLLECTION,
        query=q_emb,
        limit=top_n,
        query_filter=Filter(must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]),
    )
    return [{"table": r.payload["table"], "text": r.payload["text"]} for r in results.points]


def _build_system(ctx: dict, rag_chunks: list, app_triggered: str, is_first: bool) -> str:
    raw_hobbies = ctx["hobby_lines"] if ctx["hobby_lines"] else ["  - (none set)"]
    hobby_lines = "\n".join(re.sub(r"\s*\(weight.*?\)", "", h).strip() for h in raw_hobbies)
    adjacent    = _adjacent_activities(ctx["hobby_lines"])

    coming_up     = ctx["calendar_lines"] if ctx["calendar_lines"] != "No events in the next 14 days." else "nothing scheduled"
    today_sched   = ctx.get("today_schedule_summary", "no blocks set")
    week_sched    = ctx.get("week_schedule_summary",  "no routine set")
    week_dates    = ctx.get("week_dates", "")
    cal_connected = ctx.get("calendar_connected", False)

    block = ctx.get("schedule_block")
    block_note = (
        "RIGHT NOW is their scheduled FOCUS block — they should not be scrolling." if block == "focus"
        else "Right now is their scheduled leisure block." if block == "leisure"
        else ""
    )
    repeat_note = f"They've opened {app_triggered} {ctx['opens_today']} time(s) today already." if ctx["opens_today"] > 1 else ""

    if is_first:
        return f"""You are a blunt wellness coach.
Time: {ctx["time_label"]}, {ctx["day_label"]}. {block_note}{(" " + repeat_note) if repeat_note else ""}
Hobbies: {hobby_lines}
Also try: {adjacent}

One sentence. Tell them one specific thing to do right now based on their hobbies or adjacent activities. Do NOT reference their calendar or schedule. No greeting, no "I noticed", no questions."""

    cal_section = f"""CALENDAR TOOL (read all rules before using):
today={ctx["today_date"]} tomorrow={ctx["tomorrow_date"]}
This week's dates: {week_dates}
Busy times (do NOT overlap): {coming_up}
Weekly routine blocks: {week_sched}

Rules:
- Only use if user explicitly says schedule/add/book/plan/remind.
- Find a gap that avoids all busy times above. Only 07:00-22:00.
- ONE event per reply only. Never schedule anything about {app_triggered}.
- Do NOT mention the tag or describe what you're doing. Just answer, then silently append the tag.
- The system will confirm what was added. Do not write your own confirmation.

If scheduling: end reply with exactly:
<create_event>{{"title":"...","date":"YYYY-MM-DD","start_time":"HH:MM","end_time":"HH:MM","description":"..."}}</create_event>
If deleting (only when user says clear/delete/remove/cancel): end reply with:
<delete_events>YYYY-MM-DD</delete_events>""" if cal_connected else \
    "To add or remove calendar events, they need to connect Google Calendar in the Schedule tab."

    return f"""You are a blunt wellness coach. The person opened {app_triggered}. Get them off it.
Time: {ctx["time_label"]}, {ctx["day_label"]} | today={ctx["today_date"]} tomorrow={ctx["tomorrow_date"]}
{block_note}{(" " + repeat_note) if repeat_note else ""}
Hobbies: {hobby_lines}
Also try: {adjacent}
Today's blocks: {today_sched}

RULES (follow exactly):
- 1-2 sentences. No lists. No greetings.
- If they push back or say no: one sharp point about why scrolling is a bad call RIGHT NOW. Don't suggest another hobby.
- Never say "Your schedule looks like" or list events. Never claim you added/removed anything. Never ask "Is there anything else".
- If user says today use {ctx["today_date"]}, tomorrow use {ctx["tomorrow_date"]}.

{cal_section}"""


def _parse_create_event(text: str):
    """Extract <create_event> JSON block. Handles missing closing tag."""
    # Try with closing tag first
    match = re.search(r"<create_event>\s*(.*?)\s*</create_event>", text, re.DOTALL)
    if match:
        clean = text[:match.start()].strip()
        try:
            return clean, json.loads(match.group(1))
        except json.JSONDecodeError:
            return clean, None

    # Fallback: no closing tag — find opening tag and grab JSON after it
    open_match = re.search(r"<create_event>\s*(\{.*)", text, re.DOTALL)
    if open_match:
        clean = text[:open_match.start()].strip()
        json_str = open_match.group(1).split("</create_event>")[0].strip().rstrip("}")
        # find the complete JSON object
        brace_match = re.search(r"\{.*\}", open_match.group(1), re.DOTALL)
        if brace_match:
            try:
                return clean, json.loads(brace_match.group(0))
            except json.JSONDecodeError:
                pass
        return clean, None

    return text.strip(), None


def _create_calendar_event(refresh_token: str, event: dict) -> str:
    """Call Google Calendar API to insert the event. Returns a confirmation string."""
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build as gcal_build

    creds = Credentials(
        token=None, refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=["https://www.googleapis.com/auth/calendar"],
    )
    if not creds.valid:
        creds.refresh(Request())

    service = gcal_build("calendar", "v3", credentials=creds, cache_discovery=False)

    date       = event.get("date", datetime.now().strftime("%Y-%m-%d"))
    start_time = event.get("start_time", "09:00")
    end_time   = event.get("end_time",   "10:00")

    body = {
        "summary":     event.get("title", "Touch Grass session"),
        "description": event.get("description", ""),
        "start": {"dateTime": f"{date}T{start_time}:00", "timeZone": "America/Los_Angeles"},
        "end":   {"dateTime": f"{date}T{end_time}:00",   "timeZone": "America/Los_Angeles"},
    }

    created = service.events().insert(calendarId="primary", body=body).execute()
    return created.get("htmlLink", "")


def _build_gcal_service(refresh_token: str):
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build as gcal_build
    creds = Credentials(
        token=None, refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=["https://www.googleapis.com/auth/calendar"],
    )
    if not creds.valid:
        creds.refresh(Request())
    return gcal_build("calendar", "v3", credentials=creds, cache_discovery=False)


def _delete_events_for_date(refresh_token: str, date: str) -> int:
    """Delete all events on a given date (YYYY-MM-DD). Returns count deleted."""
    service = _build_gcal_service(refresh_token)
    day_start = f"{date}T00:00:00-07:00"
    day_end   = f"{date}T23:59:59-07:00"
    result = service.events().list(
        calendarId="primary",
        timeMin=day_start,
        timeMax=day_end,
        singleEvents=True,
    ).execute()
    count = 0
    for ev in result.get("items", []):
        try:
            service.events().delete(calendarId="primary", eventId=ev["id"]).execute()
            count += 1
        except Exception:
            pass
    return count


def _parse_delete_events(text: str):
    """Extract <delete_events> date tag. Returns (clean_text, date_str|None)."""
    match = re.search(r"<delete_events>\s*(.*?)\s*</delete_events>", text, re.DOTALL)
    if not match:
        return text.strip(), None
    return text[:match.start()].strip(), match.group(1).strip()


def _chat_sync(ctx: dict, messages: list, app_triggered: str) -> str:
    _ensure_indexed()

    query = next((m["content"] for m in reversed(messages) if m["role"] == "user"), app_triggered)
    rag_chunks = _retrieve(query, ctx["user_id"])
    is_first   = not any(m["role"] == "user" for m in messages)
    system     = _build_system(ctx, rag_chunks, app_triggered, is_first)

    response = ollama_client.chat(
        model=LANGUAGE_MODEL,
        messages=[{"role": "system", "content": system}] + messages,
        options={"temperature": 0.7, "num_predict": 80 if is_first else 350},
        stream=False,
    )
    return response["message"]["content"]


def _fallback(app: str, last_user: str, ctx: dict) -> str:
    """Context-aware fallback when model produces empty output."""
    hobby = (ctx["hobby_lines"][0] if ctx["hobby_lines"] else "").split("-")[-1].strip().split("(")[0].strip() or "something real"
    if any(w in last_user for w in ["want to scroll", "want to be on", "going to scroll", "just want to"]):
        return f"You already opened {app} knowing you'd end up here — that's the pattern. Close the tab."
    if any(w in last_user for w in [" no", "don't want", "dont want", "not going", "i won't", "i wont"]):
        return f"Then sit with the boredom for 5 minutes — that's what you're actually avoiding."
    if any(w in last_user for w in ["nothing", "nothing planned", "nothing to do", "don't have"]):
        return f"Go outside for 20 minutes. You don't need a plan for that."
    if any(w in last_user for w in ["first time", "only once", "just once"]):
        return f"First time today still counts — put {app} down and do something with {hobby}."
    return f"Close {app} and spend 30 minutes on {hobby}."


# ── Request model ────────────────────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    user_id:       str
    session_id:    Optional[str] = None
    app_triggered: str = "unknown"
    battery:       Optional[int] = None
    location:      Optional[str] = None
    messages:      List[Message] = []


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/agent/chat")
async def agent_chat(req: ChatRequest):
    pool = await get_pool()
    ctx  = await context_bundle.build(
        pool=pool,
        user_id=req.user_id,
        app_triggered=req.app_triggered,
        battery=req.battery,
        location=req.location,
    )

    messages      = [{"role": m.role, "content": m.content} for m in req.messages]
    user_spoke    = any(m["role"] == "user" for m in messages)
    loop          = asyncio.get_event_loop()
    raw           = await loop.run_in_executor(None, _chat_sync, ctx, messages, req.app_triggered)

    # Strip known system-prompt leakage before any further processing
    raw = re.sub(r"\[CALENDAR\][^\n]*", "", raw).strip()

    # Always strip tags from reply; only execute calendar action if user explicitly asked
    reply_text, delete_date = _parse_delete_events(raw)

    # Require explicit deletion keywords in the user's last message before acting
    _last_user = next((m["content"].lower() for m in reversed(messages) if m["role"] == "user"), "")
    _delete_keywords = ["clear", "delete", "remove", "cancel", "erase", "wipe", "remove that", "delete it", "clear it", "take it off", "take that off"]
    _user_asked_delete = any(w in _last_user for w in _delete_keywords)
    if not user_spoke or not _user_asked_delete:
        delete_date = None

    if delete_date and ctx.get("google_refresh_token"):
        try:
            count = await loop.run_in_executor(
                None, _delete_events_for_date, ctx["google_refresh_token"], delete_date
            )
            confirm = f"Cleared {count} event{'s' if count != 1 else ''} from your calendar on {delete_date}." if count else f"No events found on {delete_date} to remove."
            reply_text = (reply_text + "\n\n" + confirm).strip() if reply_text else confirm
        except Exception:
            reply_text = (reply_text or "") + "\n\nCouldn't clear calendar — try reconnecting Google Calendar in the Schedule tab."
    else:
        reply_text, event_data = _parse_create_event(reply_text)
        _schedule_keywords = [
            "schedule", "add", "create", "book", "set up", "put on", "block", "plan",
            "put that", "put it", "calendar", "remind", "pencil", "slot", "fit that",
            "can you put", "add that", "add it", "add to", "put in",
        ]
        _user_asked_schedule = any(w in _last_user for w in _schedule_keywords)
        if not user_spoke or not _user_asked_schedule:
            event_data = None
        event_created = None
        if event_data and ctx.get("google_refresh_token"):
            try:
                link = await loop.run_in_executor(
                    None, _create_calendar_event, ctx["google_refresh_token"], event_data
                )
                event_created = {**event_data, "link": link}
                # confirmation is shown as a separate system bubble in the UI — don't append to reply_text
            except Exception:
                reply_text = (reply_text or "") + "\n\nCouldn't add to calendar — try reconnecting Google Calendar in the Schedule tab."

    return {
        "session_id":          req.session_id or str(uuid.uuid4()),
        "intervention_id":     str(uuid.uuid4()),
        "vulnerability_score": ctx["vuln_score"],
        "redirect_suggestion": None,
        "event_created":       locals().get("event_created"),
        "message":             reply_text or (None if locals().get("event_created") else _fallback(req.app_triggered, _last_user, ctx)),
    }


@router.post("/agent/outcome")
async def record_outcome(session_id: str, outcome: str, accepted: Optional[bool] = None):
    return {"ok": True}
