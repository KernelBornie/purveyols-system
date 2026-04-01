# PURVEYOLS Construction Management System

A MERN stack web application for managing construction operations with role-based dashboards.

## Features

- **Role-Based Dashboards** for 8 roles:
  - Director – Overview, disbursements, all reports
  - Accountant – Payments, funding approvals, worker payroll
  - Engineer – Funding requests, material requests, worker enrollment, BOQ management, subcontract management
  - Foreman – Worker enrollment, funding requests, material requests
  - Driver – Logbook submissions, funding requests, material requests
  - Procurement Officer – Material request management, funding requests
  - Safety Officer – Incident reporting, funding requests, material requests
  - Admin – System maintenance, user management, project overview

- **Worker Enrollment** with NRC, phone, daily rate, site, enrolledBy
- **Worker Search** by NRC number
- **Daily Wage Payments** via mobile money simulation (Airtel / MTN)
- **Funding Request Workflow** – Engineer/Foreman → Accountant → Director
- **Material / Procurement Requests** – Procurement management
- **Driver Logbooks** – Time in/out, distance, fuel usage
- **Bill of Quantities (BOQ)** – Track project cost items
- **Subcontracts** – Manage subcontractor agreements
- **Persistent Login** – JWT stored in localStorage

## Tech Stack

- **Frontend**: React 18, React Router v6, Axios, Vite, Recharts
- **Backend**: Node.js, Express 4, express-rate-limit, express-validator
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (persistent sessions)

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally (default: `mongodb://localhost:27017/purveyols`)

### Installation

```bash
# Install all dependencies (backend + frontend)
npm run install:all

# Seed demo users
npm run seed

# Start development (backend + frontend concurrently)
npm run dev
```

The app runs at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/purveyols
JWT_SECRET=replace_with_a_long_random_secret_string
```

> **Important:** Replace `JWT_SECRET` with a long, random string (e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).


## Project Structure

```
purveyols-system/
├── backend/                   # Node.js + Express API
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   └── roleCheck.js       # Role-based access control
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Worker.js
│   │   ├── Payment.js
│   │   ├── FundingRequest.js
│   │   ├── Logbook.js
│   │   ├── ProcurementOrder.js
│   │   ├── MaterialRequest.js
│   │   ├── Project.js
│   │   ├── BOQ.js
│   │   ├── Subcontract.js
│   │   └── SafetyReport.js
│   ├── routes/                # Express routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── workers.js
│   │   ├── projects.js
│   │   ├── payments.js
│   │   ├── fundingRequests.js
│   │   ├── logbooks.js
│   │   ├── procurement.js
│   │   ├── materialRequests.js
│   │   ├── boq.js
│   │   ├── subcontracts.js
│   │   ├── safetyReports.js
│   │   └── reports.js
│   ├── server.js              # Express app entry point
│   └── seed.js                # Demo data seeder
│
└── frontend/                  # React + Vite frontend
    ├── src/
    │   ├── api/
    │   │   ├── auth.js        # Login helper
    │   │   └── axios.js       # Axios instance with JWT header
    │   ├── context/
    │   │   └── AuthContext.jsx # Authentication state
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── ProtectedRoute.jsx
    │   └── pages/             # Route pages
    │       ├── Login.jsx
    │       ├── Dashboard.jsx
    │       ├── dashboards/    # Role-specific dashboards (Director, Accountant, Engineer, Foreman, Driver, Procurement, Safety, Admin)
    │       ├── workers/
    │       ├── projects/
    │       ├── funding/
    │       ├── logbooks/
    │       ├── procurement/
    │       ├── payments/
    │       ├── boq/
    │       ├── subcontracts/
    │       ├── safety/
    │       └── reports/
    └── vite.config.js         # Vite config (proxy → backend :5000)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user (requires JWT) |
| GET/POST | /api/workers | List / Enroll worker |
| GET/POST | /api/projects | List / Create project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| GET/POST | /api/payments | List / Process payment |
| GET/POST | /api/funding-requests | List / Create request |
| PUT | /api/funding-requests/:id/approve | Approve request |
| PUT | /api/funding-requests/:id/reject | Reject request |
| GET/POST | /api/logbooks | List / Submit logbook |
| GET/POST | /api/procurement | List / Create procurement order |
| PUT | /api/procurement/:id | Update procurement order |
| GET/POST | /api/boq | List / Create BOQ item |
| PUT | /api/boq/:id | Update BOQ item |
| PUT | /api/boq/:id/submit | Submit BOQ for review |
| PUT | /api/boq/:id/share | Share BOQ |
| PUT | /api/boq/:id/approve | Approve BOQ (director only) |
| DELETE | /api/boq/:id | Delete BOQ item |
| GET/POST | /api/subcontracts | List / Create subcontract |
| PUT | /api/subcontracts/:id | Update subcontract |
| DELETE | /api/subcontracts/:id | Delete subcontract |
| GET/POST | /api/safety-reports | List / Submit safety report |
| PUT | /api/safety-reports/:id/status | Update safety report status |
| GET/POST | /api/material-requests | List / Submit material request |
| GET | /api/reports/summary | Aggregated system summary |
| GET | /api/users | List users (director only) |
| GET | /api/health | Health check (DB status) |

## 💰 Mobile Money Payments

Payments are processed via simulated **Airtel Money** and **MTN Mobile Money** (Zambia). Each disbursement generates a network-prefixed transaction reference (e.g. `AIR-ZM-…` or `MTN-ZM-…`) and records the outcome (`completed` / `failed`) on the payment record.

> **Production integration:** Replace the `simulateMobileMoney` function in `backend/routes/payments.js` with real API calls to the [Airtel Money API](https://developers.airtel.africa/) or the [MTN MoMo API](https://momodeveloper.mtn.com/).

### Payment fields

| Field | Description |
|-------|-------------|
| `mobileNetwork` | `airtel` or `mtn` |
| `transactionRef` | Network-prefixed reference generated per disbursement |
| `status` | `pending` / `completed` / `failed` |

---

## 📦 Android APK

The app ships as an Android APK using [Capacitor](https://capacitorjs.com/). A GitHub Actions workflow (`.github/workflows/build-apk.yml`) builds the APK automatically on every push.

### Build locally

> Prerequisites: Node 18+, JDK 17+, Android SDK (API 33+)

```bash
# 1. Build the web bundle
cd frontend
npm install
npm run build

# 2. Add the Android platform (first time only)
npx cap add android

# 3. Sync web assets into the Android project
npx cap sync android

# 4. Build the APK
cd android
./gradlew assembleDebug

# The APK is written to:
# frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

For a **release** (signed) APK, follow the [Capacitor Android signing guide](https://capacitorjs.com/docs/android#signing).

---

## 💻 Windows Installer (.exe)

The desktop app is powered by [Electron](https://electronjs.org/) and packaged with [electron-builder](https://www.electron.build/). A GitHub Actions workflow (`.github/workflows/build-windows.yml`) builds the `.exe` installer automatically on every push.

### Build locally

> Prerequisites: Node 18+, Windows (or Wine on Linux)

```bash
# 1. Build the frontend
cd frontend
npm install
npm run build

# 2. Build the Windows installer
cd ../electron
npm install
npm run build:win

# The installer is written to:
# electron/dist-electron/PURVEYOLS Setup *.exe
```

---

## 🌍 Online Deployment

### Frontend – Netlify

The `netlify.toml` at the repo root configures automatic deployment to [Netlify](https://netlify.com):

1. Connect the repository in the Netlify dashboard.
2. Netlify will auto-detect `netlify.toml` and deploy on every push to `main`.

For GitHub Actions-based deployment, set the following repository secrets:

| Secret | Description |
|--------|-------------|
| `NETLIFY_AUTH_TOKEN` | Your Netlify personal access token |
| `NETLIFY_SITE_ID` | The site ID from the Netlify dashboard |

### Backend – Render

The `render.yaml` at the repo root configures deployment to [Render](https://render.com):

1. Create a new **Web Service** in Render and point it to this repository.
2. Render will auto-detect `render.yaml` and configure the build.
3. Set the following environment variables in the Render dashboard (never commit these):

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string (e.g. MongoDB Atlas) |
| `JWT_SECRET` | Long random secret for JWT signing |
