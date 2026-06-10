# GymCore — Project Documentation

A gym management web app for **GymCore** (Kosovo). Members can register, buy a
membership, and book classes; trainers run classes; admins manage everything.

The project is made of **two separate programs** that run side by side:

| Part | What it is | Where | Runs on |
|---|---|---|---|
| **Backend** | Node.js + Express REST API talking to MySQL | `backend/` | `http://localhost:3000` |
| **Frontend** | Vue 3 single-page app (Vite + PrimeVue) | `frontend/` | `http://localhost:5173` |

The frontend calls the backend at `http://localhost:3000/api`. Everything runs
locally — there is no payment gateway, email service, or cloud dependency. The
membership "checkout" is a **mock**: card fields are cosmetic and never sent to
the server.

---

## 1. Tech stack

### Backend libraries

| Library | Role in simple terms |
|---|---|
| **express** | The web framework — receives HTTP requests and routes them to the right code. |
| **mysql2** | The database driver — the "phone line" between Node.js and MySQL (used via a connection pool). |
| **bcrypt** | Password hashing — passwords are never stored in plain text. |
| **jsonwebtoken** | Creates and verifies JWT login tokens (HS256, with issuer check). |
| **zod** | Validation — checks request data *and* the `.env` config before anything runs. |
| **helmet** | Adds secure HTTP headers automatically. |
| **cors** | Allows the frontend (port 5173) to call the backend (port 3000) from the browser. |
| **morgan** | Logs every request to the terminal during development. |
| **dotenv** | Loads `.env` (DB credentials, JWT secret) into the app. |
| **nodemon** (dev) | Auto-restarts the server when you save a file. |

### Frontend libraries

| Library | Role |
|---|---|
| **Vue 3 + TypeScript** | The UI framework. |
| **Vite** | Dev server and build tool. |
| **Vue Router** | Page navigation + auth/role route guards. |
| **Pinia** | State management (`stores/auth.ts` holds the token + user). |
| **PrimeVue 4** | UI component library (tables, dialogs, toasts; dark theme). |
| **axios** | HTTP client — a shared instance attaches the JWT to every request. |

---

## 2. How a request flows through the backend

Every request passes through the same chain, one direction only:

```
HTTP request
  → app.js          helmet → cors → morgan → express.json, then mounts /api
  → routes/         which URL goes to which handler (+ attaches middleware)
  → middleware      authenticate → authorize → validate
  → controllers/    read the request, call ONE service, send the response
  → services/       the business rules (passwords, capacity, dates…)
  → models/         raw parameterized SQL via the mysql2 pool
  → MySQL (gym_db)
```

### The layers, in simple terms

- **Controller — the waiter.** Takes the order (`req.body`, `req.params`,
  `req.user`), hands it to a service, brings the response back. No logic, no SQL.
- **Service — the chef.** The actual rules of the gym ("is the class full?",
  "does the password match?"). Doesn't know HTTP exists. Breaks a rule → throws
  an `ApiError`.
- **Model — the pantry.** The only layer that touches the database. Plain
  functions wrapping raw SQL with `?` placeholders (SQL-injection safe).

### The middleware, in simple terms

| Middleware | Job | If it fails |
|---|---|---|
| `helmet` / `cors` / `morgan` / `express.json` | Security headers, browser permission, logging, JSON parsing — run on every request | — |
| `authenticate` | "Who are you?" — verifies the Bearer JWT, sets `req.user` | **401** |
| `authorize('admin', …)` | "Are you allowed?" — checks `req.user.role` against the list | **403** |
| `validate(schema)` | "Is the data well-formed?" — runs the body through a Zod schema | **400** |
| `errorHandler` | Catches everything thrown anywhere and formats it into the standard error envelope | — |

### Response envelope

Every endpoint answers in the same shape:

```json
// success                                  // error
{ "success": true,                          { "success": false,
  "message": "...",                           "error": "SOME_CODE",
  "data": { ... } }                           "message": "..." }
```

---

## 3. Authentication

- On **register/login** the backend signs a JWT containing
  `{ sub: userId, role, email }` plus an `iss: "gym-api"` issuer claim
  (`src/utils/jwt.js`). Both signing **and** verification enforce the issuer.
- The frontend stores the token in `localStorage` and the axios instance sends
  it as `Authorization: Bearer <token>` on every call.
- **Roles:** `admin`, `trainer`, `member`. Public registration always creates a
  `member`; only admins can create trainers/admins.

---

## 4. Database

MySQL 8, database name **`gym_db`** (the name is hardcoded in the SQL — don't change it).

**7 tables:** `Users`, `Trainers`, `Membership_Plans`, `Memberships`,
`Class_Types`, `Classes`, `Bookings`.

Key relationships:

- A `User` may be a `Trainer` (1–1).
- A `User` has `Memberships`, each pointing to a `Membership_Plan`.
- A `Class` has one `Class_Type` and one `Trainer`.
- `Bookings` connects `Users` ↔ `Classes` (many-to-many).

Setup is one command and **destroys + recreates everything**, then loads demo
data (14 users, 4 plans, 13 classes, …):

```bash
cd backend && npm run db:setup     # ⚠ drops gym_db every time
```

---

## 5. Running the project (development)

Start things **in this order**, in separate terminals:

```bash
# 1. Start MySQL (e.g. via XAMPP)

# 2. Backend — first time only: configure and seed
cd backend
cp .env.example .env        # set DB_USER/DB_PASSWORD; JWT_SECRET must be 32+ chars
npm install
npm run db:setup            # creates + seeds gym_db (destructive)

# 3. Backend — run the API
npm run dev                 # → "Server running on port 3000 [development]"

# 4. Frontend (second terminal)
cd frontend
npm install
npm run dev                 # → open http://localhost:5173  (use localhost, not 127.0.0.1)
```

**Demo accounts** (all seeded users share the password `password123`):

| Role | Email |
|---|---|
| Admin | `admin@bbrosgym.com` |
| Trainer | `petrit.maliqi@bbrosgym.com` |
| Member | `egzon.krasniqi@gmail.com` |

---

## 6. Environment variables (backend `.env`)

Validated by Zod on startup — the server refuses to start if a required one is
missing or invalid.

| Variable | Required | Notes |
|---|---|---|
| `DB_HOST` / `DB_USER` | yes | MySQL connection (XAMPP default user: `root`) |
| `DB_PASSWORD` | no | empty allowed |
| `DB_NAME` | yes | must stay `gym_db` |
| `JWT_SECRET` | yes | **minimum 32 characters** |
| `PORT` | no | default `3000` — ⚠ the frontend URL is hardcoded to 3000 |
| `JWT_EXPIRES_IN` / `JWT_ISSUER` | no | defaults: `1d` / `gym-api` |

The frontend has **no** env vars; its API URL is hardcoded in `src/api/axios.ts`.

---

## 7. API overview

All paths are prefixed with `/api`. 🔒 = requires `Authorization: Bearer <token>`.

### Auth
| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Register (always as member) → `{ token, user }` |
| POST | `/auth/login` | public | Log in → `{ token, user }` |
| GET | `/auth/me` | 🔒 any | Current user's profile |

### Classes & class types
| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/class-types` | public | List class types |
| POST/PUT/DELETE | `/class-types…` | 🔒 admin | Manage class types (delete = soft) |
| GET | `/classes` | public | List classes (with type + trainer) |
| POST | `/classes` | 🔒 admin/trainer | Create a class |
| PUT | `/classes/:id` | 🔒 admin/trainer | Update a class |
| PUT | `/classes/:id/cancel` | 🔒 admin/trainer | Soft-cancel |
| DELETE | `/classes/:id` | 🔒 admin/trainer | Hard delete (bookings cascade) |
| GET | `/classes/:id/bookings` | 🔒 admin/trainer | Who booked a class |
| POST | `/classes/:id/join` | 🔒 member | Book into a class |
| GET | `/classes/my-bookings` | 🔒 member | The member's own bookings |

### Plans & memberships
| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/plans` | public | List membership plans |
| POST | `/memberships` | 🔒 member/admin | Buy a plan (mock — always succeeds) |
| GET | `/memberships/me` | 🔒 any | My memberships + the active one |
| PUT | `/memberships/:id/cancel` | 🔒 owner/admin | Soft-cancel a membership |

### Admin
| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/admin/dashboard` | 🔒 admin | Totals (members, classes, bookings…) |
| GET | `/admin/class-bookings` | 🔒 admin | Per-class booking stats |
| GET | `/admin/users` | 🔒 admin | List all users |
| POST | `/admin/users` | 🔒 admin | Create a user with any role |
| PATCH | `/admin/users/:id` | 🔒 admin | Activate/deactivate a user |

---

## 8. Folder map (the short version)

```
GymManagementSystem/
├── backend/
│   ├── .env / .env.example       config (secrets)
│   ├── db/                       SQL schema + seed data
│   ├── scripts/db-setup.js       creates + seeds the database
│   └── src/
│       ├── server.js             entry point (starts listening)
│       ├── app.js                Express app: global middleware + /api mount
│       ├── config/               env.js (validated config) · db.js (mysql2 pool)
│       ├── routes/               URL → handler maps, per domain
│       ├── middleware/           authenticate · authorize · validate · errorHandler
│       ├── controllers/          HTTP in/out (the "waiters")
│       ├── services/             business rules (the "chefs")
│       ├── models/               raw SQL (the "pantry")
│       ├── validators/           Zod schemas
│       └── utils/                ApiError · asyncHandler · jwt · response
│
└── frontend/
    └── src/
        ├── main.ts               bootstrap (Pinia, PrimeVue, Router)
        ├── router/index.ts       routes + auth/role guard
        ├── stores/auth.ts        auth state (token + user)
        ├── api/                  axios instance + per-domain API calls
        ├── pages/                Home, Auth, Classes, Bookings, Profile, admin/…
        ├── layouts/              AdminLayout (sidebar for /admin)
        └── components/           Navbar, Footer, PaymentModal
```

---

## 9. How to start the presentation

**Before you present (5 min earlier):** have everything already running —
MySQL started, backend (`npm run dev`) showing *"Server running on port 3000"*,
frontend open at `http://localhost:5173`, and a second browser tab already
logged in as admin. Never start servers live in front of the audience.

**Opening (about 30 seconds, in your own words):**

> "This is **GymCore**, a gym management system I built as a full-stack web
> application. It has two parts: a **Vue 3 frontend** that users see, and a
> **Node.js + Express REST API** with a **MySQL database** behind it. There are
> three roles — members, trainers, and admins. A member can register, buy a
> membership, and book classes; an admin manages users, classes, and sees
> statistics. Let me show you how it works."

**Then your first demo move:** show the **Home page** as a visitor → **register
or log in as a member** → book a class. That's the simplest story, and it
naturally leads into showing the admin side afterwards.

Keep the opening to: *what it is → what it's built with → who uses it → demo.*
Don't open with code or folder structure — show the working app first, explain
the architecture when they ask or after the demo.

---

## 10. Known limitations (honest list)

- **Mock checkout** — no real payment processing; card fields are cosmetic.
- `GET /api/classes` and `GET /api/classes/dashboard` are **unauthenticated**,
  so the "members see only upcoming classes" filter never applies.
- The frontend API URL and backend port are **hardcoded** (3000) — change one,
  change both.
- `backend/.env` is committed to git and CORS is wide open — fine locally,
  must be fixed before any real deployment.
- No automated tests, no Docker/CI, no rate limiting.
- Seed class dates are fixed (June 2026) — once they pass, members see no
  upcoming classes until you re-seed.

> For deeper details (verified issue list, conventions, troubleshooting), see
> [`CLAUDE.md`](./CLAUDE.md).
