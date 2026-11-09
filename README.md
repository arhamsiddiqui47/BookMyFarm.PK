# Bookmyfarm.pk

A verified farmhouse discovery and booking platform for Karachi (Bahria University FYP).
Stack: MongoDB, Express, React (Vite + Tailwind), Node.js, JWT auth.

## Folder layout

```
server/   Express REST API
  src/models/       User, Farmhouse, Booking, SlotLock (double-booking guard)
  src/middleware/   auth (JWT + role checks), validation, error handling
  src/routes/       /api/auth, /api/farmhouses (public + owner), /api/admin
  src/utils/upload.js   photo uploads (Cloudinary if CLOUDINARY_URL is set, else server/uploads)
  tests/            Jest + Supertest API tests
client/   React frontend
  src/context/AuthContext.jsx   login state shared by all pages
  src/components/ProtectedRoute.jsx   blocks pages by role
  src/pages/        Home, Login, Register, Farmhouses, FarmhouseDetail
  src/pages/owner/  OwnerDashboard, FarmhouseForm (add and edit with photos)
  src/pages/admin/  AdminDashboard (stats, listings by status, users), ReviewListing (verification)
```

## Run it on your laptop (Windows)

You need Node.js 20 or newer and a MongoDB database. The easiest database is a free
MongoDB Atlas cluster (https://www.mongodb.com/cloud/atlas), or install MongoDB Community locally.

1. Start the API
   ```
   cd server
   copy .env.example .env      (then edit MONGO_URI and JWT_SECRET in .env)
   npm install
   npm run seed                (creates admin@bookmyfarm.pk / admin123)
   npm run dev                 (API on http://localhost:5000)
   ```
2. Start the website, in a second terminal
   ```
   cd client
   copy .env.example .env
   npm install
   npm run dev                 (site on http://localhost:5173)
   ```
3. Run the tests: `cd server && npm test` (downloads a temporary MongoDB the first time).

## How login and roles work

- Register sends name, email, password to `POST /api/auth/register`. The password is hashed with bcrypt.
- The API returns a JWT token. The browser saves it and sends it as `Authorization: Bearer <token>`.
- `requireAuth` checks the token on protected routes; `requireRole('admin')` checks the role.
- Anyone can sign up as customer or owner. Admin accounts come only from `npm run seed`,
  so nobody can make themselves an admin from the website.

## How listing verification works

1. An owner submits a farmhouse with photos. It is saved as `pending` and is not public.
2. The admin opens it under "Pending verification" and schedules a site visit date.
3. After the visit, the admin approves or rejects it with remarks and optional visit photos.
   Approving is refused by the API if no visit was scheduled.
4. Only `approved` listings appear on the public site, with a "Verified by site visit" badge.
5. If the owner edits a live listing it goes back to `pending`, so customers never see unchecked details.
6. The admin can suspend a live listing and block users. Every action is kept in the listing's history.

## Search and compare

`GET /api/farmhouses` takes optional filters: `area`, `guests`, `minPrice`, `maxPrice`,
`amenities=pool,bbq` (must have all), `date=YYYY-MM-DD`, `slot=day|night|full`, `sort`, `page`.
- Price filters use the chosen slot's price, or the cheapest slot when no slot is chosen.
- With a date, farmhouses already booked for that slot are hidden (using the same `SlotLock`
  records the booking engine writes). With a date and no slot, only fully booked ones are hidden.
- Only `approved` listings are ever returned.

`GET /api/farmhouses/compare?ids=a,b,c` returns 2 or 3 listings for the side-by-side table, which
highlights the cheapest price per slot and the biggest capacity.
`GET /api/farmhouses/:id/availability?month=2026-12` returns booked half-days for the calendar.

## Booking policy (Vintage Vista)

- Slots: day, night or full day (24 hours). A full-day booking blocks both day and night.
- Advance: 30% of the slot price to confirm.
- Cancellation more than 72 hours before the booking date: 30% of the advance is refunded.
- Cancellation within 72 hours: no refund.
These are stored per farmhouse (`advancePercent`, `cancelWindowHours`, `earlyCancelRefundPercent`).

## How double booking is prevented (built in Week 4)

Every booked half-day (day or night) of a farmhouse gets a row in `SlotLock` with a unique
index on (farmhouse, date, half). A full-day booking takes both halves. If two customers
book the same slot at the same moment, MongoDB accepts only the first insert and rejects
the second, so a double booking is impossible even under load.

## Build progress

- [x] Week 1: setup, database models, login and roles
- [x] Week 2: owner listings with photos and admin site-visit verification
- [x] Week 3: search, filter and compare
- [ ] Week 4: booking engine, calendar, cancel and transfer
- [ ] Week 5: dashboards, mock payment, emails
- [ ] Week 6: deploy (Vercel + Render) and demo rehearsal
