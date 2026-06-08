# Summary of Changes 💪

A simple recap of what we worked on in the GymCore app (Vue 3 + PrimeVue frontend, Express + MySQL backend).

---

## 1. Documented the project
- Created **`CLAUDE.md`** — a full guide to the codebase: how it's structured, how to run it, the API list, and known issues.

## 2. Memberships + "Join a class"
- Added **membership plans** on the backend (`GET /memberships/plans`, `GET /memberships/me`, `POST /memberships`).
- Homepage now shows **membership cards** you can buy.
- Classes page got a **Join** button — it's disabled until you have an active membership.
- Booking a class is now blocked on the server unless you have a membership.

## 3. Admin dashboard
- Wired the already-built **dashboard to `/admin`** (it was finished but not connected).
- Fixed a backend bug: `/admin/class-bookings` crashed (wrong column name `ClassName` → `Name`).
- Locked down the admin endpoints so **only admins** can see them.

## 4. "My Bookings" page
- Found out bookings **were saving fine** — there was just no page showing them.
- Added a **`GET /classes/my-bookings`** endpoint (your own bookings).
- Built the **My Bookings page** with a clean table + empty state.

## 5. Dark mode fix 🌙
- Tables were showing **white-on-white text** (invisible rows).
- Fixed it at the **theme level** (the dark color palette was flipped) so every PrimeVue component looks right.

## 6. Rebrand: "BBros Gym" → "GymCore"
- Updated the **name everywhere it shows** (navbar, footer, browser tab, homepage, docs).
- Left the demo login emails (`@bbrosgym.com`) untouched — we can rebrand the email domain separately later.

---

## Good to know
- Demo admin login: **admin@bbrosgym.com / password123**
- Run it locally:
  ```
  cd backend  && npm run dev     # API on :3000
  cd frontend && npm run dev     # app on :5173
  ```
- The database was **not** wiped — existing bookings are safe.
