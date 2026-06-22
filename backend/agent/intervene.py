"""
Calls Claude to generate intervention messages.
Returns the agent reply and (optionally) a parsed redirect_suggestion.
"""
import os
import re
import json
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
import anthropic

load_dotenv(Path(__file__).parent.parent.parent / ".env")

_client: Optional[anthropic.Anthropic] = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return _client


SYSTEM_PROMPT = """You are a behavioral coach embedded in someone's phone. You intercept doomscrolling before it takes hold.

USER:
- Identity: {identity}
- Tone to use: {tone_desc}
- Top hobbies:
{hobby_lines}

RIGHT NOW:
- App opened: {app_triggered} at {time_label} on {day_label}
- Vulnerability score: {vuln_score}/100 ({vuln_label})
- Battery: {battery}%
- Location: {location}
- Schedule: {schedule_label}
- Opens of this app today: {opens_today}

CALENDAR (next 24h):
{calendar_lines}

RECENT BEHAVIOR:
{recent_behavior}

RULES — read these carefully:
1. Your FIRST message must be ONE sharp observation. Reference something specific from context (exam, battery, time, how many times today, what they should be doing). Never start with "I noticed" or "Hey". Never ask a question in the first message.
2. Keep every message under 2 sentences.
3. Don't lecture. Don't moralize. Observe, then redirect.
4. After 1-3 exchanges, end the conversation with a redirect. When you do, append a JSON block:
<redirect>
{{"hobby": "basketball", "place": "Willard Park", "distance": "0.4mi", "open_until": "10pm", "drill": "weak-hand layup, 3 sets of 10"}}
</redirect>
Only include fields that are relevant (don't invent a place if location is unknown).
5. If there's a high-stakes event within 12 hours: prioritize study/prep, not hobbies. The redirect should be a focus session or sleep, not recreation.
6. Match the tone exactly: tough_love = blunt/direct, gentle = warm but firm, coach = strategic/motivational."""


def build_system(ctx: dict) -> str:
    hobby_lines = "\n".join(ctx["hobby_lines"]) if ctx["hobby_lines"] else "  - (no hobbies set)"
    return SYSTEM_PROMPT.format(
        identity=ctx["identity"],
        tone_desc=ctx["tone_desc"],
        hobby_lines=hobby_lines,
        app_triggered=ctx["app_triggered"],
        time_label=ctx["time_label"],
        day_label=ctx["day_label"],
        vuln_score=ctx["vuln_score"],
        vuln_label=ctx["vuln_label"],
        battery=ctx["battery"] if ctx["battery"] is not None else "unknown",
        location=ctx["location"] or "unknown",
        schedule_label=ctx["schedule_label"],
        opens_today=ctx["opens_today"],
        calendar_lines=ctx["calendar_lines"],
        recent_behavior=ctx["recent_behavior"],
    )


def parse_redirect(text: str) -> tuple[str, Optional[dict]]:
    """Split agent text from <redirect>JSON</redirect> block."""
    match = re.search(r"<redirect>\s*(.*?)\s*</redirect>", text, re.DOTALL)
    if not match:
        return text.strip(), None
    clean_text = text[:match.start()].strip()
    try:
        suggestion = json.loads(match.group(1))
    except json.JSONDecodeError:
        suggestion = None
    return clean_text, suggestion


def chat(system: str, messages: list[dict]) -> str:
    """Single blocking call to Claude. Returns raw text."""
    response = _get_client().messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=system,
        messages=messages,
    )
    return response.content[0].text


async def stream_chat(system: str, messages: list[dict]):
    """Async generator that yields text chunks for SSE streaming."""
    import asyncio
    from functools import partial

    loop = asyncio.get_event_loop()

    def _stream():
        chunks = []
        with _get_client().messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system=system,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                chunks.append(text)
        return "".join(chunks)

    full_text = await loop.run_in_executor(None, _stream)
    return full_text
