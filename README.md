# Event Ticketing Platform

A full-stack event ticket booking system with two application roles: **Admin** and **Customer**.

## Current architecture

- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL
- Authentication: JWT bearer tokens
- Ticket payment: mock payment flow
- Ticket: QR code generation

## Roles

### Admin
- Create events
- Create venues
- Create pricing tiers
- Create shows and assign a pricing tier to each show
- Generate venue seats
- View all customer bookings

### Customer
- Register and login
- Browse events
- View show details
- Select and temporarily lock seats
- Create booking
- Complete mock payment
- View QR ticket
- View and cancel own bookings

## Run the backend

From `backend`:

```powershell
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
```

The API will be available at `http://127.0.0.1:8001`.

Health check: `http://127.0.0.1:8001/health`
Swagger: `http://127.0.0.1:8001/docs`

## Run the frontend

From `frontend`:

```powershell
npm install
npm run dev
```

The frontend will normally be available at `http://localhost:5173`.

The frontend defaults to the backend port **8001**. To override it, create `frontend/.env` with:

```text
VITE_API_URL=http://127.0.0.1:8001
```

## Database configuration

Create `backend/.env` locally. Do not commit real passwords or secrets. Use `backend/.env.example` as a template.

If the database already existed before per-show pricing was added, run this once in PostgreSQL:

```sql
ALTER TABLE shows ADD COLUMN IF NOT EXISTS pricing_tier_id INTEGER;
UPDATE shows SET pricing_tier_id = (SELECT MIN(id) FROM pricing_tiers) WHERE pricing_tier_id IS NULL;
ALTER TABLE shows ALTER COLUMN pricing_tier_id SET NOT NULL;
ALTER TABLE shows ADD CONSTRAINT fk_shows_pricing_tier FOREIGN KEY (pricing_tier_id) REFERENCES pricing_tiers(id);
```

Only run the final two statements if they have not already been applied.
