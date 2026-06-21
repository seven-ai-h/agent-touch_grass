from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_pool

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
async def login(body: LoginRequest):
    pool = await get_pool()

    row = await pool.fetchrow(
        """
        SELECT id, email
        FROM users
        WHERE email = $1
          AND password_hash = crypt($2, password_hash)
        """,
        body.email.lower().strip(),
        body.password,
    )

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"user_id": str(row["id"]), "email": row["email"]}
