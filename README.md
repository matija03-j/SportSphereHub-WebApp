# SportSphere Hub

A full-stack web platform for booking sports facilities, scheduling trainings, buying equipment,
finding teammates, and running promotions. Built as a university project for the course
**Programiranje internet aplikacija (IR3PIA)**.

> **Note:** The application's user interface, demo data, and validation messages are in **Serbian**. This
> README is in English; the app itself remains localized.

![Angular](https://img.shields.io/badge/Angular-20-DD0031)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933)
![Express](https://img.shields.io/badge/Express-5-000000)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)

---

## Features

### Athlete
- Search facilities by city, sport, price, and rating, with an interactive **Leaflet + OpenStreetMap** map.
- Reserve courts/halls in valid time slots and manage/cancel reservations.
- Book trainings with trainers.
- Post and browse **teammate ads** to find people to play with.
- Buy equipment from the in-app **shop**.
- View personal **statistics** with **Chart.js** diagrams.
- Manage a profile with an uploaded photo or a generated **DiceBear** avatar.

### Employee
- Register (subject to admin approval) and manage assigned facilities.
- Create facilities individually or in bulk via **JSON upload**.
- Handle reservations: confirm attendance or mark no-shows within the allowed window.
- Manage a drag-and-drop **calendar** (Angular CDK) for indoor halls.
- Run **promotions**, manage **equipment** stock, and generate **PDF reports** (pdfkit) on facility
  occupancy and equipment turnover.

### Administrator
- Approve or reject employee and facility registration requests.
- Manage users, facilities, sports, and trainers.
- Logs in through a **hidden admin entry point** (not linked from the public site).

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Angular 20 (standalone components, signals, reactive forms, HttpClient + JWT interceptor) |
| Backend    | Node.js + Express 5 + TypeScript (REST API) |
| Database   | MongoDB with Mongoose ODM |
| Auth       | JWT bearer tokens; passwords hashed with `bcryptjs` |
| Notable libs | Leaflet + OpenStreetMap (maps), Chart.js (statistics), Angular CDK drag-and-drop (calendar), DiceBear (avatars), pdfkit (PDF reports), Nodemailer + Ethereal (password-reset emails) |

---

## Screenshots

<!-- Add screenshots here, e.g.:
![Home](docs/screenshots/home.png)
![Facility search](docs/screenshots/search.png)
![Employee calendar](docs/screenshots/calendar.png)
-->

_Coming soon._

---

## Prerequisites

- **Node.js 18+** and npm
- **MongoDB** running locally at `mongodb://localhost:27017`

---

## Getting started

### 1. Install dependencies

```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 2. Configure environment

Create `backend/.env` (an `.env.example` is provided):

| Variable         | Example / default                                | Description                          |
|------------------|--------------------------------------------------|--------------------------------------|
| `PORT`           | `4000`                                           | Backend API port                     |
| `MONGO_URI`      | `mongodb://localhost:27017/sportsphere_hub`      | MongoDB connection string            |
| `JWT_SECRET`     | `some_secret`                                    | Secret used to sign JWTs             |
| `JWT_EXPIRES`    | `2h`                                             | Token lifetime                       |
| `CLIENT_URL`     | `http://localhost:4200`                          | Allowed CORS origin (frontend)       |
| `RESET_URL_BASE` | `http://localhost:4200/reset-password`           | Base URL for password-reset links    |

### 3. Seed the database

> **Warning:** the seed script **drops** the existing `sportsphere_hub` database and recreates it
> from scratch (collections + indexes + demo data). It runs **independently of the application** —
> the app itself never creates collections (Mongoose `autoCreate`/`autoIndex` are disabled).

```bash
cd backend
npm run seed
```

The seed inserts enough data to demonstrate every feature: an administrator, athletes and employees
(approved and pending), facilities (approved and pending), courts/halls, reservations in all
statuses, trainings and trainers, promotions, equipment, orders, teammate ads, and reviews, across
multiple cities and sports.

### 4. Run the app

**Backend:**

```bash
cd backend
npm run build      # compile TypeScript -> dist/
npm run serve      # run dist/server.js on port 4000
# or, during development, with auto-restart:
npm run dev
```

> After changing anything under `backend/src`, re-run `npm run build` before `npm run serve` (or use
> `npm run dev`, which recompiles automatically).

**Frontend:**

```bash
cd frontend
npm start          # ng serve -> http://localhost:4200
```

Then open **http://localhost:4200**.

---

## Demo accounts

| Role          | Username | Password    | Notes                                              |
|---------------|----------|-------------|----------------------------------------------------|
| Administrator | `admin`  | `Admin123!` | Logs in via the hidden route `/admin`              |
| Athlete       | `marko`  | `Lozinka1!` | Others: `jovana`, `nikola`, `ana`                  |
| Employee      | `milan`  | `Lozinka1!` | Others: `dragan`, `sara`                           |

> The administrator signs in **only** through the hidden `/admin` route (not reachable from the home
> page or menu). Athletes and employees use the public `/login` form.

---

## Project structure

```
SportSphereHub-WebApp/
├── backend/                 Express + TypeScript REST API (port 4000)
│   ├── src/
│   │   ├── config/          env + MongoDB connection
│   │   ├── models/          Mongoose schemas
│   │   ├── middleware/       auth, validation, uploads, error handling
│   │   ├── controllers/      request handlers (one per domain)
│   │   ├── routes/           routers aggregated under /api
│   │   └── utils/            JWT, passwords, mailer, geocoding, dates
│   ├── seed/                 database creation + demo data seeding
│   └── uploads/              uploaded files + default images
└── frontend/                Angular 20 SPA (port 4200)
    └── src/app/
        ├── core/            services, guards, interceptor, models
        └── features/        pages grouped by role: public, athlete, employee, admin
```

The REST API is served under `/api` and groups routes by domain (`/auth`, `/facilities`,
`/reservations`, `/trainings`, `/shop`, `/reviews`, `/stats`, `/employee`, `/admin`, `/teammates`,
`/sports`, `/users`). Uploaded files are served statically from `/uploads`.

---

## Architecture notes

- **The app never creates collections or indexes.** Mongoose `autoCreate` and `autoIndex` are
  disabled globally; the database schema, indexes, and demo data exist **only** because `npm run
  seed` creates them. Adding a model or index requires updating the seed script.
- **Authentication** uses JWT bearer tokens. The backend protects routes with `authenticate` +
  `requireRole(...)`; the Angular frontend attaches the token via an HTTP interceptor and guards
  routes with a signal-based `AuthService` and `roleGuard`.
- **Uploads** are stored on disk with randomized filenames and served from `/uploads`.
- **Password reset** issues a token valid for 30 minutes; the reset link is printed to the server
  console and can optionally be emailed via a Nodemailer Ethereal test account.

---

## Business rules (enforced server-side)

- **Password:** 8–12 characters, must start with a letter, and contain an uppercase letter, a digit,
  and a special character.
- **Matični broj (company ID):** exactly 8 digits (unique). **PIB (tax ID):** exactly 9 digits, not
  starting with 0 (unique).
- At most **2 employees per facility**; at most **5 sports per user**.
- **Reservation:** minimum 1 hour, starts on the full hour, no overlaps, within working hours.
- **Cancellation** allowed only **≥ 12 hours** before the slot.
- Employee **confirm / no-show** actions allowed only up to **10 minutes** after the slot starts;
  after a defined number of no-shows, a user loses the right to reserve at that facility.
- A facility **rating** requires a confirmed reservation; the number of ratings cannot exceed the
  number of confirmed reservations.
- A new facility becomes visible **only after administrator approval**.

---

## Tests

- **Frontend:** `cd frontend && npm test` (Karma + Jasmine).
- **Backend:** no automated test suite is currently configured.

---

## License

This repository is coursework for the IR3PIA course and is provided for educational purposes; no
formal open-source license is attached.
