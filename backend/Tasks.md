# Project Tasks

---

## Backend (40 Tasks)

### Setup & Foundation
- [x] 1. Project setup — package.json, scripts, .gitignore, .env
- [x] 2. Database schema — 6 tables: Users, Trainers, Membership_Plans, Memberships, Classes, Bookings
- [x] 3. Seed data — 14 test users (1 admin, 3 trainers, 10 members), 9 classes, 19 bookings
- [x] 4. Database setup script — one command to create and seed the whole database
- [x] 5. MySQL connection pool — connects the app to the database
- [x] 6. Environment validation — server refuses to start if anything is missing from .env
- [x] 7. JWT sign and verify — creates and reads login tokens
- [x] 8. Centralized error handler — catches all errors and returns a clean response
- [x] 9. Request validation — checks every request for missing or invalid fields
- [x] 10. Authentication middleware — blocks requests without a valid token
- [x] 11. Role-based access — restricts routes to admin, trainer, or member

### Auth
- [x] 12. Register endpoint — creates a new member account and returns a token
- [x] 13. Login endpoint — checks credentials and returns a token
- [x] 14. Get current user endpoint — returns the logged-in user's profile

### Membership Plans
- [ ] 15. Membership plans — database queries (get all, get one, create, update, delete)
- [ ] 16. Membership plans — input validation rules (name, price, duration, includes classes)
- [ ] 17. Membership plans — business logic (list all plans, admin creates, edits, and deletes)
- [ ] 18. Membership plans — API endpoints (GET /plans public, write endpoints admin only)

### Memberships
- [ ] 19. Buy a membership — database queries (create membership, get user's memberships)
- [ ] 20. Buy a membership — business logic (calculate end date from plan duration, copy price from plan)
- [ ] 21. Buy a membership — API endpoint (member picks a plan and payment method)
- [ ] 22. View own memberships — endpoint for member to see their membership history
- [ ] 23. Admin view all memberships — see every membership with user details
- [ ] 24. Admin update membership status — mark a membership as cancelled or expired

### Classes
- [ ] 25. Classes — database queries (get all, get by trainer, get one, create, update, change status)
- [ ] 26. Classes — input validation rules (name, category, dates, capacity, room)
- [ ] 27. Classes — business logic (list upcoming classes, trainer creates their own, admin manages all)
- [ ] 28. Classes — API endpoints (GET public, POST/PUT/DELETE for trainer and admin)

### Bookings
- [ ] 29. Bookings — database queries (create, get by user, get by class, cancel)
- [ ] 30. Bookings — input validation rules
- [ ] 31. Bookings — capacity check (use a database transaction to prevent overbooking)
- [ ] 32. Bookings — cancel logic (update the booking status, do not delete the row)
- [ ] 33. Bookings — API endpoints (book a class, cancel a booking, view own bookings)

### Admin
- [ ] 34. Admin — list all users with their role, status, and join date
- [ ] 35. Admin — create a trainer account (creates user and trainer profile in one step)
- [ ] 36. Admin — deactivate or reactivate a user account
- [ ] 37. Admin — view all bookings for a specific class (see who is enrolled)

### Trainer
- [ ] 38. Trainer — view the list of members enrolled in their classes
- [ ] 39. Membership check before booking — member must have an active plan that includes classes

### Docs
- [ ] 40. Update README — add all new endpoints with their URLs and payloads

---

## Frontend (40 Tasks)

### Setup
- [ ] 1. Install Tailwind CSS, vue-router, Pinia, and Axios
- [ ] 2. Configure Tailwind CSS — set up the config file and import it into the project
- [ ] 3. Set up Axios — base URL pointed at the backend, automatically adds the JWT token to every request
- [ ] 4. Set up Pinia auth store — saves the token and logged-in user, clears everything on logout
- [ ] 5. Configure vue-router — define all routes and which role can access each one
- [ ] 6. Route guards — redirect to login if not authenticated, block pages the user's role can't access
- [ ] 7. App shell — set up App.vue with the router view and global layout wrapper

### Auth Pages
- [ ] 8. Login page — email and password form, calls the login API, saves the token
- [ ] 9. Register page — sign up form for new members (name, email, password, phone)
- [ ] 10. Persistent login — user stays logged in after closing and reopening the browser
- [ ] 11. Logout — clears the token and user from the store and redirects to login

### Shared Components
- [ ] 12. Navigation bar — links based on the user's role and a logout button
- [ ] 13. Loading spinner — shown while waiting for API responses
- [ ] 14. Toast notifications — success and error messages that appear and disappear automatically
- [ ] 15. Confirmation modal — reusable popup for cancel and delete actions
- [ ] 16. Empty state — shown when a list has no items (e.g. no bookings yet)
- [ ] 17. Form error display — show validation errors under each field

### Member Pages
- [ ] 18. Member dashboard — welcome screen showing active membership status and next booked class
- [ ] 19. Browse classes page — list of all upcoming classes with trainer, time, room, and spots left
- [ ] 20. Class card component — reusable card showing class details and a book button
- [ ] 21. Book a class — sends the booking request, shows success or full class message
- [ ] 22. My bookings page — list of the member's upcoming booked classes
- [ ] 23. Cancel a booking — cancel button that opens the confirmation modal before sending the request
- [ ] 24. My membership page — shows the current plan name, start date, end date, and status
- [ ] 25. Membership plans page — lists all available plans with name, price, and what is included
- [ ] 26. Buy a membership — member selects a plan and payment method and confirms the purchase

### Trainer Pages
- [ ] 27. Trainer dashboard — summary of upcoming classes and total spots booked
- [ ] 28. My classes page — list of the trainer's own scheduled classes
- [ ] 29. Create a class form — name, category, date, start time, end time, room, and max capacity
- [ ] 30. Edit a class — same form pre-filled with the existing class data
- [ ] 31. Cancel a class — cancel button with confirmation modal
- [ ] 32. View enrolled members — click a class to see who has booked it

### Admin Pages
- [ ] 33. Admin dashboard — total members, active memberships, and upcoming classes count
- [ ] 34. Users table — list all users with name, role, status, and join date
- [ ] 35. Deactivate or reactivate a user — toggle button with confirmation
- [ ] 36. Create trainer form — fill in user details plus specialization and hire date
- [ ] 37. All memberships page — table of every membership with member name, plan, and status
- [ ] 38. Update membership status — admin marks a membership as cancelled or expired
- [ ] 39. All classes page — admin view of every class across all trainers with status
- [ ] 40. Class bookings view — admin clicks a class and sees the full list of who booked it
