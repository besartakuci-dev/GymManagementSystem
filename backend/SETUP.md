# Backend Setup Guide (Windows)

This guide takes you from zero to a running backend. Follow the steps in order.

---

## 1. Install the required tools

Download and install these if you don't have them already:

| Tool | Download | Notes |
|------|----------|-------|
| Node.js | https://nodejs.org | Download the **LTS** version |
| Git | https://git-scm.com | Use all default options during install |
| XAMPP | https://www.apachefriends.org | Needed for MySQL and phpMyAdmin |
| Postman | https://www.postman.com/downloads | For testing the API |

After installing Node.js, open **Command Prompt** and verify it worked:
```
node -v
npm -v
```
Both should print a version number.

---

## 2. Clone the repository

Open **Command Prompt** and run:
```
git clone https://github.com/besartakuci-dev/GymManagementSystem.git
cd GymManagementSystem
```

---

## 3. Start MySQL with XAMPP

1. Open **XAMPP Control Panel** (search for it in the Start menu)
2. Click **Start** next to **Apache**
3. Click **Start** next to **MySQL**

Both rows should turn green. Leave XAMPP open — if you close it MySQL stops.

---

## 4. Set up the database

Open your browser and go to:
```
http://localhost/phpmyadmin
```

You don't need to create anything manually. Just leave phpMyAdmin open so you can verify the database was created in the next step.

---

## 5. Install dependencies

In Command Prompt, navigate to the backend folder:
```
cd backend
npm install
```

This downloads all the packages the project needs. It takes a minute or two.

---

## 6. Create the database and load test data

Still inside the `backend` folder, run:
```
npm run db:setup
```

You should see:
```
Creating schema...
Schema ready.
Inserting seed data...
Seed data inserted.
Database setup complete — gym_db is ready.
```

Go back to phpMyAdmin and refresh the page. You should now see **gym_db** in the left sidebar with 6 tables inside it: Users, Trainers, Membership_Plans, Memberships, Classes, Bookings.

---

## 7. Start the backend

```
npm run dev
```

You should see:
```
Server running on port 3000 [development]
```

The API is now live at `http://localhost:3000`. Keep this terminal open.

---

## 8. Test with Postman

Open Postman and test the following requests.

---

### Register a new account

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/auth/register`
- Go to the **Body** tab → select **raw** → set the dropdown to **JSON**
- Paste this:

```json
{
  "email": "test@gmail.com",
  "password": "mypassword1",
  "firstName": "Arta",
  "lastName": "Berisha"
}
```

Click **Send**. You should get back a token and the new user's details.

---

### Login with a test account

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/auth/login`
- **Body → raw → JSON:**

```json
{
  "email": "admin@bbrosgym.com",
  "password": "password123"
}
```

Click **Send**. Copy the `token` value from the response — you need it for the next request.

---

### Get the current user

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/auth/me`
- Go to the **Headers** tab and add:
  - Key: `Authorization`
  - Value: `Bearer ` followed by the token you copied (e.g. `Bearer eyJhbGci...`)

Click **Send**. You should get back the admin user's profile.

---

## Test accounts

All seed accounts use the password `password123`.

| Role    | Email                         |
|---------|-------------------------------|
| Admin   | admin@bbrosgym.com            |
| Trainer | petrit.maliqi@bbrosgym.com    |
| Trainer | saranda.krasniqi@bbrosgym.com |
| Member  | egzon.krasniqi@gmail.com      |
| Member  | blerta.hoxha@gmail.com        |

---

## Common problems

**`npm run db:setup` fails with "Access denied"**
→ Make sure MySQL is running in XAMPP and `DB_USER=root` with empty `DB_PASSWORD` in `.env`.

**`npm run dev` fails with "Cannot find module"**
→ You skipped `npm install`. Run it and try again.

**phpMyAdmin shows no gym_db**
→ Run `npm run db:setup` again. If it still fails, check that MySQL is started in XAMPP.

**Port 3000 already in use**
→ Change `PORT=3001` in `.env` and restart.
