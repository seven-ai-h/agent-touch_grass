import os
from pathlib import Path
import asyncpg
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://touchgrass:touchgrass_dev@localhost:5432/touchgrass"
)

_pool = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL)
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
