from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import get_pool, close_pool
from routers import auth, dashboard, schedule, google_auth, calendar, report, interventions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(google_auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(schedule.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")
app.include_router(report.router, prefix="/api")
app.include_router(interventions.router, prefix="/api")

@app.on_event("startup")
async def startup():
    await get_pool()

@app.on_event("shutdown")
async def shutdown():
    await close_pool()
