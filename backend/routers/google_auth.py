import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from dotenv import load_dotenv
from db import get_pool

load_dotenv(Path(__file__).parent.parent.parent / ".env")

# required for http (localhost) during dev
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

router = APIRouter()

SCOPES       = ["https://www.googleapis.com/auth/calendar"]
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")

CLIENT_CONFIG = {
    "web": {
        "client_id":     os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
        "token_uri":     "https://oauth2.googleapis.com/token",
        "redirect_uris": [REDIRECT_URI],
    }
}

# in-memory store: state key → Flow (one entry per in-flight OAuth attempt)
_pending: dict[str, Flow] = {}


@router.get("/auth/google/connect")
def google_connect(user_id: str):
    flow = Flow.from_client_config(CLIENT_CONFIG, scopes=SCOPES, redirect_uri=REDIRECT_URI)
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        state=user_id,
    )
    _pending[state] = flow
    return RedirectResponse(url=auth_url)


@router.get("/auth/google/callback")
async def google_callback(code: str, state: str):
    flow = _pending.pop(state, None)
    if flow is None:
        raise HTTPException(status_code=400, detail="OAuth state expired or invalid. Please try connecting again.")

    flow.fetch_token(code=code)
    refresh_token = flow.credentials.refresh_token

    if not refresh_token:
        raise HTTPException(status_code=400, detail="Google did not return a refresh token. Try revoking access at myaccount.google.com/permissions and reconnecting.")

    pool = await get_pool()
    await pool.execute(
        "UPDATE users SET google_refresh_token = $1 WHERE id = $2",
        refresh_token,
        state,
    )

    return RedirectResponse(url="http://localhost:5173?calendar=connected", headers={"Cache-Control": "no-cache"})
