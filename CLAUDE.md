# CLAUDE.md — Gym Management System (GymCore)

> **Last updated: 2026-06-09**
>
> Guidance for working in this repository. This file documents how the project is
> structured, how to run it, and the known issues a new developer will hit.
> It was produced by reading the actual source — where docs and code disagreed,
> the **code** is treated as the source of truth and the disagreement is flagged.
>
> Reflects the work done on 2026-06-08–09: memberships + class joining, the
> membership-plan **purchase** (cosmetic/mock checkout) and **cancellation** flow
> (PrimeVue ConfirmDialog), the admin dashboard wiring + fixes, the "My Bookings"
> page/endpoint, the PrimeVue dark-mode fix, and the "BBros Gym" → "GymCore" rebrand.

---

## 1. Project overview (plain English)

This is a **gym management web app** for "GymCore" (Kosovo). It has two parts that
run as **separate programs**:

- **Backend** — a Node.js + Express **REST API** that talks to a **MySQL** database.
  It handles accounts/login (with JWT tokens), gym classes, class types, bookings,
  and admin statistics. Lives in `backend/`.
- **Frontend** — a **Vue 3** single-page web app (built with Vite, styled with
  PrimeVue) that calls the backend API. Lives in `frontend/`.

There is also a third `package.json` at the repo root — **ignore it**, it is a stray
accidental install (see Issues). The real code is only in `backend/` and `frontend/`.

**Roles:** every user is one of `admin`, `trainer`, or `member`. Members can register
themselves and book classes; trainers run classes; admins manage everything.

**What actually works today:** the backend API for auth + classes + class-types +
admin stats + admin user management + membership plans/purchase/cancel is implemented.
The frontend can register, log in, show the public class schedule, join classes, view
"My Bookings", **purchase** a membership (via the cosmetic mock checkout on the **Home**
page) and **cancel** it from the **Profile** page. The admin area lives under `/admin`
(a sidebar layout with dashboard, members list, and create-user). The standalone
**Plans** page and the **trainer dashboard** are built but **not routed** — see Issues §11.

---

## 2. Tech stack at a glance

| Layer | Technology | Where |
|---|---|---|
| Backend runtime | Node.js (ESM, `"type":"module"`) | `backend/` |
| Web framework | Express 4 | `backend/src/app.js` |
| Database | MySQL 8 (InnoDB), driver `mysql2` | `backend/db/`, `backend/src/config/db.js` |
| Auth | JWT (`jsonwebtoken`, HS256) + `bcrypt` password hashing | `backend/src/utils/jwt.js` |
| Validation | Zod | `backend/src/validators/` |
| Security/logging | helmet, cors, morgan | `backend/src/app.js` |
| Frontend framework | Vue 3 + TypeScript | `frontend/` |
| Build tool / dev server | Vite | `frontend/vite.config.ts` |
| State management | Pinia | `frontend/src/stores/auth.ts` |
| Routing | Vue Router | `frontend/src/router/index.ts` |
| UI components | PrimeVue 4 + primeicons | `frontend/src/main.ts`, `theme.ts` |
| HTTP client | axios | `frontend/src/api/axios.ts` |

**No third-party external services.** There is no payment gateway, email/SMS, OAuth,
or cloud SDK. The membership checkout is **cosmetic/simulated** — the card fields on the
Plans page are never sent to the backend; only the plan id and a `paymentMethod` label are
stored, and the membership is recorded as `paid` immediately. "Payment method" is just a
stored field. Everything runs locally.

---

## 3. Architecture summary

### Backend request flow (one direction only)

```
HTTP request
  → app.js (helmet → cors → morgan → express.json → mounts router at /api)
  → routes/*.routes.js      (maps URL to handlers; attaches middleware)
  → middleware              (authenticate → authorize → validate)
  → controllers/*.js        (read req, call a service, send response)
  → services/*.js           (business logic: bcrypt, JWT, rules)
  → models/*.js             (raw parameterized SQL via the mysql2 pool)
  → MySQL (gym_db)
```

- **Every API route is mounted under `/api`** (`app.js:15`). Sub-routers:
  `/api/auth`, `/api/class-types`, `/api/classes`, `/api/admin`, `/api/plans`,
  `/api/memberships`.
- **Standard response envelope** (`utils/response.js`, `middleware/errorHandler.js`):
  - Success: `{ "success": true, "message": "...", "data": {...} }`
  - Error: `{ "success": false, "error": "<CODE>", "message": "...", "details"?: {...} }`
- **Errors** are thrown (as `ApiError` or `ZodError`) and caught centrally by
  `asyncHandler` + `errorHandler`. MySQL duplicate-key errors become `409`.
- **Auth**: `signToken` puts `{ sub: userId, role, email }` in the JWT.
  `authenticate` reads `Authorization: Bearer <token>`, verifies it, and sets
  `req.user`. `authorize('admin', 'trainer', ...)` checks `req.user.role`.
- **DB connection is a lazy pool** — the server starts even if MySQL is down; the
  first query is when it fails. There is no health-check route.

### Frontend flow

```
main.ts (registers Pinia, PrimeVue+theme, ToastService, ConfirmationService, Router) → App.vue
  → router/index.ts  (routes + global beforeEach guard for auth/roles)
  → pages/*.vue      (call api/*.ts)
  → api/axios.ts     (axios instance, baseURL http://localhost:3000/api,
                      request interceptor adds the Bearer token from localStorage)
  → backend
```

- **Auth state** lives in the Pinia store `stores/auth.ts`. The **JWT is stored in
  `localStorage` under the key `token`**; the user object is held in memory only.
- `router/index.ts` has a global guard: unauthenticated users hitting a
  `requiresAuth` route are sent to `/login`; wrong-role users are sent to
  `/unauthorized`. The user's `Role` is lower-cased before being matched against the
  route's `roles`.

### Frontend ↔ backend contract

- Frontend calls **`http://localhost:3000/api`** (hardcoded). Backend defaults to
  **port 3000** and mounts at `/api`. **They match out of the box.**
- **CORS is wide open** (`app.use(cors())`), so the browser is allowed to call
  cross-origin from the Vite dev server (port **5173**). No Vite proxy is used or
  needed for local dev.
- The auth header name, token format, and response shapes all match between the two
  sides (verified). The one shape mismatch is the login-vs-register user object —
  see Issues §11.

---

## 4. Folder structure

```
GymManagementSystem/                  ← THE PROJECT ROOT (git repo lives here)
├── CLAUDE.md                         ← this file
├── package.json / package-lock.json  ← STRAY accidental install — ignore (see Issues)
├── node_modules/                     ← stray, accidentally committed — ignore
│
├── backend/                          ← the API
│   ├── .env                          ← real config (⚠ committed to git — see Issues)
│   ├── .env.example                  ← template to copy
│   ├── package.json                  ← backend scripts & deps
│   ├── README.md                     ← cross-platform setup + API notes
│   ├── SETUP.md                      ← Windows/XAMPP step-by-step guide
│   ├── Tasks.md                      ← task tracker (partly outdated — see Issues)
│   ├── db/
│   │   ├── 01_gym_schema_simple.sql  ← THE real schema (drops & recreates gym_db)
│   │   ├── 02_gym_seed_data_simple.sql ← THE real seed data (14 users, classes…)
│   │   └── erd.png                    ← entity-relationship diagram
│   ├── scripts/
│   │   └── db-setup.js               ← runs the two SQL files (npm run db:setup)
│   └── src/
│       ├── server.js                 ← ENTRY POINT (starts the HTTP listener)
│       ├── app.js                    ← Express app: middleware + routes
│       ├── config/  env.js (loads/validates .env) · db.js (mysql2 pool)
│       ├── routes/  index.js + auth/class/classType/admin/plans/membership .routes.js
│       ├── controllers/  one per domain (read req → call service → respond)
│       ├── services/     business logic per domain
│       ├── models/       raw SQL (user, class, admin, membership)
│       ├── middleware/   authenticate, authorize, validate, errorHandler
│       ├── validators/   Zod schemas (auth, class, classType, membership)
│       └── utils/        ApiError, asyncHandler, jwt, response
│
└── frontend/                         ← the Vue app
    ├── index.html                    ← mount point (forces dark mode via class="dark")
    ├── package.json                  ← frontend scripts & deps
    ├── vite.config.ts                ← Vite config (@ → ./src alias; no proxy)
    ├── tsconfig*.json                ← TypeScript project config
    ├── env.d.ts                      ← Vite type shims
    └── src/
        ├── main.ts                   ← app bootstrap (plugins + mount)
        ├── App.vue                   ← shell: Navbar + RouterView + Footer
        ├── theme.ts                  ← PrimeVue custom theme preset
        ├── router/index.ts           ← routes + auth/role guard
        ├── stores/auth.ts            ← Pinia auth store (token + user) ← source of truth
        ├── composables/  useAuth.ts (DEAD duplicate of the store, unused) ·
        │                  useCancelMembership.ts (cancel-membership confirm flow)
        ├── api/  axios.ts · auth.ts · classes.ts · admin.ts · plans.ts (plans + memberships)
        ├── layouts/AdminLayout.vue   ← sidebar shell that wraps the /admin pages
        ├── pages/  Home, Auth, Classes, About, Profile, Bookings, Unauthorized,
        │           admin/(AdminDashboard → /admin, MembersPage → /admin/members,
        │                  CreateUserPage → /admin/users/create, AdminPage ← orphaned),
        │           trainer/(MyClassesPage ← orphaned; /trainer/classes uses ClassesPage),
        │           PlansPage · AdminDashboardPage · TrainerDashboardPage ← built but NOT routed
        ├── components/  Navbar.vue, Footer.vue
        ├── assets/      images
        └── styles/      base.css, variables.css
```

---

## 5. Environment variables

The **backend** reads `.env` from `backend/`. It is **validated on startup** by
`src/config/env.js` (Zod) — **if a required one is missing/invalid, the server
prints the errors and exits immediately**.

| Variable | Required? | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | one of development / production / test |
| `PORT` | no | `3000` | API port. ⚠ If you change it, the frontend won't follow (see Issues §11) |
| `DB_HOST` | **yes** | — | usually `localhost` |
| `DB_PORT` | no | `3306` | MySQL port |
| `DB_USER` | **yes** | — | MySQL user (XAMPP default: `root`) |
| `DB_PASSWORD` | no | `""` | empty is allowed (XAMPP default) |
| `DB_NAME` | **yes** | — | must be `gym_db` (the SQL hardcodes this name — see Issues §11) |
| `JWT_SECRET` | **yes** | — | **must be ≥ 32 characters** or the server refuses to start |
| `JWT_EXPIRES_IN` | no | `1d` | token lifetime, e.g. `1d`, `7d` |
| `JWT_ISSUER` | no | `gym-api` | label embedded in the token |

- **The frontend uses NO environment variables.** Its backend URL is hardcoded to
  `http://localhost:3000/api`. There is no `frontend/.env`.
- A ready-to-use `backend/.env` is already committed (XAMPP defaults). That is
  convenient but is a security problem — see Issues §11.

---

## 6. Database setup

- **Engine:** MySQL 8 (InnoDB). **Database name:** `gym_db`.
- **Tables (6):** `Users`, `Trainers`, `Membership_Plans`, `Memberships`,
  `Class_Types`, `Classes`, `Bookings`. (That's 7 — the docs sometimes say "6"
  because `Class_Types` was added later.)
- **Relationships:** Users 1–1 Trainers · Users 1–N Memberships N–1 Membership_Plans ·
  Class_Types 1–N Classes N–1 Trainers · Users N–M Classes via Bookings.

### How to set it up

You do **not** create the database by hand. The setup script does it for you:

```bash
cd backend
npm run db:setup
```

What this does (`backend/scripts/db-setup.js`):
1. Connects to MySQL **with no database selected**.
2. Runs `db/01_gym_schema_simple.sql`, which **`DROP DATABASE IF EXISTS gym_db`**,
   then recreates it and all tables.
3. Runs `db/02_gym_seed_data_simple.sql` to insert demo data (14 users, 3 trainers,
   4 plans, 2 class types, 9 classes, 11 memberships, 19 bookings).

> ⚠ **`db:setup` is fully destructive every time it runs** — it drops the entire
> `gym_db` database with no confirmation and no backup. Re-run it only when you are
> OK losing all local data.

### Demo login accounts

All 14 seeded accounts share the password **`password123`** (stored as bcrypt hashes).

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bbrosgym.com` | `password123` |
| Trainer | `petrit.maliqi@bbrosgym.com` | `password123` |
| Trainer | `saranda.krasniqi@bbrosgym.com` | `password123` |
| Member | `egzon.krasniqi@gmail.com` | `password123` |
| Member | `blerta.hoxha@gmail.com` (and 8 more members) | `password123` |

> ⚠ Demo credentials only — never use these (or the committed `JWT_SECRET`) on a
> shared/public/production server.

---

## 7. Install dependencies

Dependencies are installed **separately** in each subproject (there is **no** root
workspace — do not run install at the repo root):

```bash
# Backend
cd backend
npm install
# If bcrypt fails to build (native module): npm install bcryptjs,
# then change `import bcrypt from 'bcrypt'` → 'bcryptjs' in src/services/auth.service.js

# Frontend (in a second terminal)
cd frontend
npm install
```

**Node version:** the frontend `package.json` requires Node **`^20.19.0 || >=22.12.0`**.
(The backend README says "Node 18+", but follow the frontend requirement — use Node 20.19+ or 22.12+.)

---

## 8. How to run (development)

> **Order matters. Start them in this sequence.** Use three terminals (or run MySQL
> as a service).

1. **Start MySQL first** (e.g. start MySQL in XAMPP, or your local MySQL 8 server).
2. **Set up the database (first time, or to reset):**
   ```bash
   cd backend && npm run db:setup
   ```
3. **Start the backend API:**
   ```bash
   cd backend && npm run dev
   ```
   You should see: `Server running on port 3000 [development]`
   API is now at `http://localhost:3000`.
4. **Start the frontend:**
   ```bash
   cd frontend && npm run dev
   ```
   Vite serves the app at `http://localhost:5173`. Open it in `localhost`
   (not `127.0.0.1`) so it can reach the backend.

> The backend must be running on port **3000** for the frontend to work — the URL is
> hardcoded.

---

## 9. How to run (production-style)

There is **no deployment config** in this repo (no Dockerfile, no CI, no process
manager). The closest to "production" is:

```bash
# Backend (no build step needed — it's plain ESM)
cd backend
# ensure backend/.env has NODE_ENV=production and a unique strong JWT_SECRET
npm start          # → node src/server.js

# Frontend (build static files, then serve dist/ with any static host)
cd frontend
npm run build      # type-checks then bundles into frontend/dist/
npm run preview    # optional: locally preview the production build
```

For a real deployment you would additionally need: a process manager (pm2/systemd),
a restricted CORS origin, a production MySQL, and an env-driven frontend API URL
(none of which exist yet).

---

## 10. Available scripts

### Root `package.json`
- **No scripts.** It only lists three dependencies and is a stray accidental install
  (see Issues §11). Nothing here is part of the build.

### `backend/package.json`
| Script | Command | What it does |
|---|---|---|
| `npm start` | `node src/server.js` | Run the API once (production-style). |
| `npm run dev` | `nodemon src/server.js` | Run the API in dev mode; auto-restarts on save. |
| `npm run db:setup` | `node scripts/db-setup.js` | **Drops & recreates** `gym_db`, loads schema + seed data. |

### `frontend/package.json`
| Script | Command | What it does |
|---|---|---|
| `npm run dev` | `vite` | Start the Vite dev server (HMR) on port 5173. |
| `npm run build` | `run-p type-check build-only` | Type-check **and** build in parallel. |
| `npm run build-only` | `vite build` | Produce the production bundle in `dist/`. |
| `npm run type-check` | `vue-tsc --build` | TypeScript type-check (includes `.vue` files). |
| `npm run preview` | `vite preview` | Serve the built `dist/` locally to preview. |

---

## 11. Known issues, blockers & gotchas

These were verified against the source. **Nothing here blocks a fresh local setup on
default ports** — the app installs and runs. But these matter when developing,
debugging, or deploying.

### Security / repo hygiene (fix before any deployment)
- **`backend/.env` is committed to git** (the repo at `GymManagementSystem/` is a git
  repo). `.env` is **not** in `backend/.gitignore`, and the committed `JWT_SECRET`
  (`gym-management-secret-key-change-in-production-ok`) is the real token-signing key.
  `backend/README.md` falsely claims ".env is gitignored." → Add `.env` to
  `.gitignore`, `git rm --cached backend/.env`, and rotate the secret.
- **The root `node_modules/` is committed** — ~3,251 files, ~97% of all tracked files.
  Together with the stray root `package.json`/`package-lock.json` (only `axios`,
  `primevue`, `primeicons`), it's an accidental `npm install` at the repo root.
  → Delete them, add a root `.gitignore` with `node_modules/`.
- **A Jira API token is hardcoded** in `GymManagementSystem/.claude/settings.local.json`.
  Good news: that file is **git-ignored and was never committed** (local only). Still,
  rotate the token and don't store secrets in settings files.
- **Open CORS** (`app.use(cors())` allows any origin) and **no rate limiting** on
  login/register. Low risk for this local, Bearer-token design (no cookies), but
  restrict origins and add a login rate limiter before production.
- **All demo accounts share `password123`**, including the admin.

### Real bugs
- **Two class endpoints have no auth and leak data.** `GET /api/classes/dashboard` and
  especially `GET /api/classes/:id/bookings` (which returns booked members' **names +
  emails**) have **no `authenticate`/`authorize`** middleware. → Gate them to
  admin/trainer. *(The two `/api/admin/*` endpoints are now admin-gated.)*
- **`GET /api/classes` has no auth, so the member-only filter never runs.** The route has
  no `authenticate` middleware, so `req.user` is `undefined`; the service's "members see only
  upcoming + active classes" filter (`findAll({ upcomingOnly, activeOnly })`, keyed on
  `req.user.role === 'member'`) is therefore skipped for everyone. → Members see **all**
  classes, including past / cancelled / completed ones (the UI renders those as
  "Unavailable"). Gate the route, or apply the filter unconditionally in the query.
- **Login and register return different user shapes.** `login` omits
  `Phone/DateOfBirth/JoinDate/CreatedAt`, so right after login `ProfilePage.vue` shows
  "Invalid Date" for *Member Since* until a full page reload calls `/auth/me`. → Make
  login re-fetch via `findById`, or add those columns to `findByEmail`.

### Frontend wiring gaps (features that look present but aren't connected)
- **Several built pages are orphaned (not routed).** `PlansPage.vue` (the dedicated
  membership checkout), `AdminDashboardPage.vue` and `pages/admin/AdminPage.vue` (both
  superseded by `layouts/AdminLayout.vue` + `pages/admin/AdminDashboard.vue`), and
  `pages/trainer/MyClassesPage.vue` exist but aren't used by the router. `/trainer/classes`
  now renders `ClassesPage`, and membership **purchase happens on the Home page, not `/plans`**.
- **Membership/plans API calls all live in one module:** `api/plans.ts`
  (`getPlans` · `subscribe` · `getMyMemberships` · `cancelMembership`). Used by `stores/auth.ts`,
  `HomePage.vue`, `PlansPage.vue`, and `useCancelMembership.ts`.
- **No 401 response interceptor.** An expired JWT doesn't auto-logout; the SPA looks
  "logged in" until a page reload re-runs `/auth/me`.
- **Hardcoded API URL.** `api/axios.ts` hardcodes `baseURL: http://localhost:3000/api`.
  If you change the backend `PORT` (`SETUP.md` even suggests `PORT=3001`), the frontend
  breaks with no warning. → Make it `VITE_API_URL`-driven. *(`ClassesPage.vue` now routes
  through the shared `api` instance, so this is the only hardcoded spot left.)*
- **Dead code:** `composables/useAuth.ts` duplicates the Pinia store and is unused;
  `vite-plugin-vue-devtools` is a dependency but not registered. Dark mode is forced
  (`class="dark"` in `index.html`, matched by `darkModeSelector: '.dark'` in `main.ts`)
  with no toggle. Note: `theme.ts`'s dark `surface` scale must stay monotonic
  light→dark (`surface.0` lightest = text, `surface.900/950` darkest = backgrounds) —
  it was previously inverted, which made every un-overridden PrimeVue component (e.g.
  DataTable) render light-on-light; now fixed.
- **Admin "Add schedule" trainer dropdown shows IDs, not names.** `AdminDashboardPage.vue`
  builds each option label from `trainer.FullName || trainer.Name`, but `GET /api/classes`
  returns the trainer as `TrainerName` — so options render as "Trainer 1 / 2 / 3". Selecting
  still works (the value is `TrainerID`); only the labels are wrong. → Use `trainer.TrainerName`.

### Data / docs gotchas
- **Seed class dates are fixed**, not relative. Scheduled demo classes are
  `2026-06-10` … `2026-06-15`. After those dates pass, a **member's "upcoming classes"
  view will be empty** (admin/trainer views are unaffected). Re-seed or edit the dates.
- **`DB_NAME` must stay `gym_db`.** `db:setup` ignores `DB_NAME` (the name is hardcoded
  in the SQL), but the running app connects using `DB_NAME`. Change it and the app
  can't find the database.
- **Some classes shown in the UI are hardcoded, not from the DB.** The Home page "Our
  Classes" tiles (`HomePage.vue`) are a static array (Fitness / Pilates / Yoga / CrossFit),
  and `ClassesPage.vue` falls back to hardcoded `SAMPLE_CLASS_SCHEDULES` rows (e.g. "Coach
  Alex") when a category has no real classes. Only **Yoga** and **Pilates** class types exist
  in the seed, so the Fitness/CrossFit schedule pages always show placeholders. Classes you
  actually create appear on `/classes/<category>`, never on the Home tiles.
- **Admin schedule list is sorted oldest-first.** `GET /api/classes` returns
  `ORDER BY StartDateTime ASC`, so a newly added (future) class lands at the **bottom** of the
  AdminDashboardPage list, under already-finished ones.
- **Class `category` is hardcoded to `Yoga`|`Pilates`** in the Zod validator, decoupled
  from the dynamic `Class_Types` table. You can create a new class type via the admin
  API, but you then can't create a class using it (400 error) until you edit
  `validators/class.schema.js`.
- **Docs disagree:** `README.md` (generic MySQL) vs `SETUP.md` (Windows/XAMPP);
  `Tasks.md` references Tailwind (the app actually uses PrimeVue) and marks built
  frontend work as not-done. Trust the code.

---

## 12. API reference (verified)

All paths are prefixed with `/api`. "Auth" = requires `Authorization: Bearer <token>`.

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/auth/register` | no | — | Register a new **member** (role is forced to `member`). Returns `{ token, user }`. |
| POST | `/auth/login` | no | — | Log in. Returns `{ token, user }`. |
| GET | `/auth/me` | yes | any | Current user's profile. |
| GET | `/class-types` | no | — | List all class types. |
| GET | `/class-types/:id` | no | — | One class type. |
| POST | `/class-types` | yes | admin | Create a class type. |
| PUT | `/class-types/:id` | yes | admin | Update a class type. |
| DELETE | `/class-types/:id` | yes | admin | Soft-delete (sets `IsActive=false`). |
| GET | `/classes` | no | — | List classes (+ class types + trainers). |
| GET | `/classes/:id` | no | — | One class. |
| GET | `/classes/dashboard` | ⚠ none | — | Per-class booked counts. **Missing auth (bug).** |
| GET | `/classes/:id/bookings` | ⚠ none | — | Bookings for a class incl. member name/email. **Missing auth (PII leak).** |
| GET | `/classes/trainer/:trainerId` | yes | admin/trainer | Classes for a trainer (trainer = own only). |
| POST | `/classes` | yes | admin/trainer | Create a class. |
| PUT | `/classes/:id` | yes | admin/trainer | Update a class. |
| PUT | `/classes/:id/cancel` | yes | admin/trainer | Cancel (status → cancelled). |
| DELETE | `/classes/:id` | yes | admin/trainer | **Hard delete** — removes the class row (its `Bookings` cascade-delete via FK). Used by the admin "Remove" button, which shows a confirm dialog. *(`PUT /:id/cancel` remains the soft-cancel.)* |
| POST | `/classes/:id/join` | yes | member | Book the member into a class. |
| GET | `/classes/my-bookings` | yes | member | The logged-in member's own bookings (joined with class + type + time + trainer). |
| GET | `/plans` | no | — | List all membership plans (`PlanID, PlanName, DurationMonths, Price, IncludesClasses, Description`), ordered by `Price`. |
| POST | `/memberships` | yes | member/admin | **Mock checkout (always succeeds — no gateway, no card validation).** Body `{ planId, paymentMethod? }` (`paymentMethod` defaults to `card`; **no card fields are accepted**). Records a `paid`/`active` membership (`StartDate`=today, `EndDate`=today+`DurationMonths`, `Amount`=plan price, `PaidAt`=now) and returns the created row incl. `PlanName`. |
| GET | `/memberships/me` | yes | any | The current user's memberships (most recent first), joined with plan name, as `{ memberships, active }` where `active` is the single in-force membership (or `null`). |
| PUT | `/memberships/:id/cancel` | yes | member/admin | **Soft-cancel** a membership (`Status`→`cancelled`; row kept, no refund). 404 if not found; **403 if a non-admin tries to cancel a membership they don't own**; 409 `MEMBERSHIP_NOT_ACTIVE` if it isn't currently `active`. Returns the updated membership. |
| GET | `/admin/dashboard` | yes | admin | Counts (members, memberships, classes, bookings). |
| GET | `/admin/class-bookings` | yes | admin | Per-class booking stats. |
| GET | `/admin/users` | yes | admin | List all users. |
| POST | `/admin/users` | yes | admin | Create a user with any role (`member`/`trainer`/`admin`). Body: `{ firstName, lastName, email, password, role, phone?, dateOfBirth? }`. |

---

## 13. Quick-start for a new developer

```bash
# 0. Prerequisites: Node 20.19+ (or 22.12+) and MySQL 8 running (XAMPP is fine).

# 1. Get the backend ready
cd GymManagementSystem/backend
cp .env.example .env          # (a committed .env already exists; this is the clean way)
                              #  set DB_USER / DB_PASSWORD to match your MySQL,
                              #  keep DB_NAME=gym_db, set a 32+ char JWT_SECRET
npm install                   # if bcrypt fails to build, see §7

# 2. Create + seed the database (DESTRUCTIVE: drops gym_db)
npm run db:setup              # expect "Database setup complete — gym_db is ready."

# 3. Start the backend API (leave this terminal running)
npm run dev                   # expect "Server running on port 3000 [development]"

# 4. In a second terminal, start the frontend
cd GymManagementSystem/frontend
npm install
npm run dev                   # open the printed http://localhost:5173 URL

# 5. Log in with a demo account
#    email: admin@bbrosgym.com   password: password123
```

**If something goes wrong:**
- `db:setup` "Access denied" → MySQL not running, or `DB_USER`/`DB_PASSWORD` wrong in `.env`.
- Server says "Invalid environment variables" and exits → a required env var is
  missing or `JWT_SECRET` is under 32 chars.
- Server starts but every API call returns `500 INTERNAL_ERROR` → MySQL isn't reachable
  (the pool connects lazily, so the server starts anyway). Confirm MySQL is up and the
  `DB_*` values match.
- Frontend loads but data/login fails → backend isn't running on port 3000, or you
  opened the app via `127.0.0.1` instead of `localhost`.
- Port 3000 in use → change `PORT` in `backend/.env`, **but** then you must also update
  the hardcoded URL in `frontend/src/api/axios.ts`.
- Member sees no upcoming classes → the seed class dates (June 2026) have passed;
  re-seed or edit `backend/db/02_gym_seed_data_simple.sql`.

---

## 14. Conventions when changing code

- **Don't refactor or "clean up" unrelated code** unless asked.
- Backend follows a strict **route → middleware → controller → service → model** flow.
  Add features the same way (a new domain = one file in each of those folders + wire it
  in `routes/index.js`). Keep raw SQL in `models/` and use **parameterized queries**.
- All HTTP responses should go through `sendSuccess()` / the `errorHandler` envelope.
- Frontend: do all API calls through `src/api/` (the shared axios instance), never
  import raw `axios` with a hardcoded URL. Auth state lives only in `stores/auth.ts`.
- Database name `gym_db` is hardcoded in the SQL — don't rename it without updating both
  the SQL and `DB_NAME`.
```
