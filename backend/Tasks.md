# Backend Tasks

---

## Project Setup

- [x] 1. `package.json` — ESM (`"type": "module"`), `start`, `dev`, `db:setup` scripts
- [x] 2. `.env` and `.env.example` with all required variables (DB, JWT, PORT)
- [x] 3. `.gitignore` — ignores `node_modules/`, `.env`, logs
- [x] 4. `src/config/env.js` — reads `.env` and crashes on startup if anything's missing or wrong
- [x] 5. `src/config/db.js` — mysql2 connection pool, UTC timezone
- [x] 6. `scripts/db-setup.js` — one command to drop, recreate, and seed the database

---

## Database

- [x] 7. `db/01_gym_schema_simple.sql` — 6-table MySQL schema (Users, Trainers, Membership_Plans, Memberships, Classes, Bookings)
- [x] 8. `db/02_gym_seed_data_simple.sql` — 14 test users with Albanian names, 9 classes, 19 bookings
- [x] 9. `db/erd.png` — ER diagram showing all tables and relationships

---

## Core Utilities and Middleware

- [x] 10. `src/utils/ApiError.js` — custom error class that carries a `statusCode` and short error `code`
- [x] 11. `src/utils/asyncHandler.js` — wraps async controllers so unhandled rejections reach the error handler
- [x] 12. `src/utils/response.js` — `sendSuccess()` helper that enforces `{ success, data, message }` shape
- [x] 13. `src/utils/jwt.js` — `signToken()` and `verifyToken()` using env secret, issuer, and expiry
- [x] 14. `src/middleware/errorHandler.js` — maps ApiError, ZodError, ER_DUP_ENTRY, and unknown errors to the right HTTP status
- [x] 15. `src/middleware/validate.js` — runs a Zod schema against `req.body`, `params`, and `query`; stores result in `req.validated`
- [x] 16. `src/middleware/authenticate.js` — reads `Authorization: Bearer`, verifies the JWT, attaches `req.user`
- [x] 17. `src/middleware/authorize.js` — role guard, e.g. `authorize('admin', 'trainer')`

---

## App Wiring

- [x] 18. `src/app.js` — Express app with helmet, cors, morgan, JSON body parser, routes, 404 handler, error handler
- [x] 19. `src/server.js` — starts the HTTP listener on `config.PORT`
- [x] 20. `src/routes/index.js` — mounts all routers under `/api`

---

## Auth

- [x] 21. `src/validators/auth.schema.js` — Zod schemas for register (email, password, name, optional phone/DOB) and login
- [x] 22. `src/models/user.model.js` — `findByEmail` (with hash), `findById` (without hash), `createUser`
- [x] 23. `src/services/auth.service.js` — `register` (bcrypt hash + insert), `login` (compare + sign token), `getProfile`
- [x] 24. `src/controllers/auth.controller.js` — `register`, `login`, `me` handlers
- [x] 25. `src/routes/auth.routes.js` — `POST /register`, `POST /login`, `GET /me`
- [x] 26. `README.md` — full walkthrough: setup steps, folder explanation, request flow, endpoints, how to add features

---

## Membership Plans

- [ ] 27. `src/validators/plan.schema.js` — Zod schemas for creating and updating a plan
- [ ] 28. `src/models/plan.model.js` — `findAll`, `findById`, `create`, `update`, `remove`
- [ ] 29. `src/services/plan.service.js` + `src/controllers/plan.controller.js` — list, get one, create, update, delete
- [ ] 30. `src/routes/plan.routes.js` — `GET /api/plans` (public), `POST /PUT /DELETE` (admin only); mount in `routes/index.js`

---

## Memberships

- [ ] 31. `src/validators/membership.schema.js` + `src/models/membership.model.js` — Zod schema for buying a plan; model with `findByUser`, `findAll`, `create`, `updateStatus`
- [ ] 32. `src/services/membership.service.js` — buy membership (copy price from plan, calculate endDate), check if member has an active membership
- [ ] 33. `src/controllers/membership.controller.js` + `src/routes/membership.routes.js` — member buys and views own; admin views all, updates status

---

## Classes

- [ ] 34. `src/validators/class.schema.js` + `src/models/class.model.js` — Zod schemas for create/update; model with `findAll`, `findById`, `findByTrainer`, `create`, `update`, `updateStatus`
- [ ] 35. `src/services/class.service.js` — list upcoming classes, trainer creates/cancels their own, admin manages any
- [ ] 36. `src/controllers/class.controller.js` + `src/routes/class.routes.js` — `GET /api/classes` (public), `POST/PUT/DELETE` (trainer/admin); mount in `routes/index.js`

---

## Bookings

- [ ] 37. `src/validators/booking.schema.js` + `src/models/booking.model.js` — Zod schema for booking a class; model with `create`, `findByUser`, `findByClass`, `cancel`
- [ ] 38. `src/services/booking.service.js` — book a class inside a transaction using `SELECT ... FOR UPDATE` to check capacity before inserting; cancel flips the status on the existing row (re-booking after cancel is an update, not a new insert, because of the unique constraint on UserID + ClassID)
- [ ] 39. `src/controllers/booking.controller.js` + `src/routes/booking.routes.js` — `POST /api/bookings`, `DELETE /api/bookings/:id`, `GET /api/bookings`; mount in `routes/index.js`

---

## Admin

- [ ] 40. `src/models/admin.model.js` + `src/services/admin.service.js` + `src/controllers/admin.controller.js` + `src/routes/admin.routes.js` — list all users, create trainer account (User + Trainer row in one transaction), deactivate/reactivate a user; all endpoints locked to the admin role
