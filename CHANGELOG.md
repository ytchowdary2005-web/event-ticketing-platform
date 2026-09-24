# Project updates

## Updated package

- Added `frontend/src/config.js` with a default backend URL of `http://127.0.0.1:8001`.
- Added `frontend/.env.example` so the API port can be changed without editing source code.
- Improved login/registration network error messages.
- Invalid/expired sessions are now cleared instead of leaving the UI in a half-logged-in state.
- Fixed logout state reset for the selected pricing tier.
- Creating a pricing tier now refreshes the pricing dropdown immediately.
- Creating a show now clears the selected pricing tier after success.
- Event details now show each show's ticket price.
- Added an admin-only `GET /bookings/all` endpoint.
- Admin booking management now shows customer name and email.
- Booking list is ordered newest first.
- Improved event details queries and included show pricing information.
- Admin-only backend operations now match the project scope of Admin + Customer.
- Added `/health` endpoint for a quick backend connectivity check.
- Added a database migration script for the `shows.pricing_tier_id` column.
- Removed the uploaded database password and JWT secret from the distributable package; use `backend/.env.example`.
