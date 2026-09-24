import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, Base

# Models
from app.models.user import User
from app.models.venue import Venue
from app.models.seat import Seat
from app.models.email_verification import EmailVerification

# Authentication
from app.auth.router import router as auth_router

# Routers
from app.routers.event import router as event_router
from app.routers.venue import router as venue_router
from app.routers.seat import router as seat_router
from app.routers.show import router as show_router
from app.routers.pricing import router as pricing_router
from app.routers.show_seat import router as show_seat_router
from app.routers.seat_lock import router as seat_lock_router
from app.routers.booking import router as booking_router
from app.routers.payment import router as payment_router
from app.routers.ticket import router as ticket_router
from app.routers.admin_dashboard import router as admin_dashboard_router


# Create database tables that are defined in SQLAlchemy models.
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Event Ticketing Platform",
    description="Concurrency-safe event ticket booking system",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

# Render production frontend URL can be added through:
# CORS_ORIGINS=https://your-frontend.onrender.com
#
# Multiple origins can be separated by commas.
#
# Local development remains supported by default.

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
)

allow_origins = [
    origin.strip()
    for origin in cors_origins.split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUTHENTICATION
# ============================================================

app.include_router(auth_router)


# ============================================================
# EVENT MANAGEMENT
# ============================================================

app.include_router(event_router)
app.include_router(venue_router)
app.include_router(seat_router)
app.include_router(show_router)
app.include_router(pricing_router)
app.include_router(show_seat_router)
app.include_router(seat_lock_router)


# ============================================================
# BOOKING / PAYMENT / TICKETS
# ============================================================

app.include_router(booking_router)
app.include_router(payment_router)
app.include_router(ticket_router)


# ============================================================
# ADMIN DASHBOARD
# ============================================================

app.include_router(admin_dashboard_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Event Ticketing Platform API is running"
    }


# ============================================================
# DATABASE TEST
# ============================================================

@app.get("/db-test")
def database_test():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT 1")
        )

        return {
            "database": "connected",
            "result": result.scalar()
        }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "event-ticketing-api"
    }