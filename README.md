# Bookmyfarm.pk

A verified farmhouse discovery and booking platform for Karachi (Bahria University FYP).
Stack: MongoDB, Express, React (Vite + Tailwind), Node.js, JWT auth.

## Folder layout

```
server/   Express REST API
  src/models/       User, Farmhouse, Booking, SlotLock (double-booking guard)
  src/middleware/   auth (JWT + role checks), validation, error handling
  src/routes/       /api/auth, /api/dashboard (more added each week)
  tests/            Jest + Supertest API tests
client/   React frontend
  src/context/AuthContext.jsx   login state shared by all pages
  src/components/ProtectedRoute.jsx   blocks pages by role
  src/pages/        Home, Login, Register, Dashboard
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

## How double booking is prevented (built in Week 4)

Every booked half-day (day or night) of a farmhouse gets a row in `SlotLock` with a unique
index on (farmhouse, date, half). A full-day booking takes both halves. If two customers
book the same slot at the same moment, MongoDB accepts only the first insert and rejects
the second, so a double booking is impossible even under load.

## Build progress

- [x] Week 1: setup, database models, login and roles
- [ ] Week 2: owner listings (Cloudinary photos) and admin site-visit verification
- [ ] Week 3: search, filter and compare
- [ ] Week 4: booking engine, calendar, cancel and transfer
- [ ] Week 5: dashboards, mock payment, emails
- [ ] Week 6: deploy (Vercel + Render) and demo rehearsal
