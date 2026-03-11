# PURVEYOLS Construction Management System

A MERN stack web application for managing construction operations with role-based dashboards.

## Features

- **Role-Based Dashboards** for 7 roles:
  - Director – Overview, disbursements, all reports
  - Accountant – Payments, funding approvals, worker payroll
  - Engineer – Funding requests, material requests, worker enrollment
  - Foreman – Worker enrollment, funding requests, material requests
  - Driver – Logbook submissions
  - Procurement Officer – Material request management
  - Safety Officer – Incident reporting

- **Worker Enrollment** with NRC, phone, daily rate, site, enrolledBy
- **Worker Search** by NRC number
- **Daily Wage Payments** via mobile money simulation (Airtel / MTN)
- **Funding Request Workflow** – Engineer/Foreman → Accountant → Director
- **Material Requests** – Procurement management
- **Driver Logbooks** – Time in/out, distance, fuel usage
- **Weekly & Monthly Reports** – Wages, workers, logistics
- **Offline-First PWA** – Service worker + IndexedDB for offline functionality
- **Persistent Login** – JWT stored in localStorage

## Tech Stack

- **Frontend**: React.js, React Router v7, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (persistent sessions)
- **Offline**: PWA Service Worker + IndexedDB

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally

### Installation

```bash
# Install all dependencies
npm run install:all

# Seed demo users
npm run seed

# Start development (both server + client)
npm run dev
```

The app runs at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Environment Variables

Copy `server/.env.example` to `server/.env` and set:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/purveyols
JWT_SECRET=your_secure_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Demo Accounts

After running `npm run seed`, use these credentials (password: `password123`):

| Role | Email |
|------|-------|
| Director | director@purveyols.com |
| Accountant | accountant@purveyols.com |
| Engineer | engineer@purveyols.com |
| Foreman | foreman@purveyols.com |
| Driver | driver@purveyols.com |
| Procurement | procurement@purveyols.com |
| Safety Officer | safety@purveyols.com |

## Project Structure

```
purveyols-system/
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Worker.js
│   │   │   ├── Payment.js
│   │   │   ├── FundingRequest.js
│   │   │   ├── MaterialRequest.js
│   │   │   ├── DriverLogbook.js
│   │   │   └── SafetyReport.js
│   │   ├── routes/            # Express routes
│   │   │   ├── auth.js
│   │   │   ├── workers.js
│   │   │   ├── payments.js
│   │   │   ├── fundingRequests.js
│   │   │   ├── materialRequests.js
│   │   │   ├── logbooks.js
│   │   │   ├── safetyReports.js
│   │   │   └── reports.js
│   │   └── middleware/
│   │       └── auth.js        # JWT authentication middleware
│   ├── server.js              # Express app entry point
│   └── seed.js                # Demo data seeder
│
└── client/                    # React frontend
    ├── public/
    │   ├── manifest.json      # PWA manifest
    │   └── service-worker.js  # Offline service worker
    └── src/
        ├── contexts/
        │   └── AuthContext.js # Authentication state
        ├── utils/
        │   ├── api.js         # Axios instance with auth
        │   └── indexedDB.js   # Offline storage utilities
        └── components/
            ├── auth/          # Login & Register
            ├── dashboards/    # Role-specific dashboards
            ├── workers/       # Worker enrollment & list
            ├── payments/      # Mobile money payments
            ├── funding/       # Funding request workflow
            ├── materials/     # Material requests
            ├── logbooks/      # Driver logbooks
            ├── safety/        # Safety incident reports
            ├── reports/       # Weekly/monthly reports
            └── shared/        # Navbar, UI components
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET/POST | /api/workers | List / Enroll worker |
| GET | /api/workers/search?nrc=... | Search by NRC |
| GET/POST | /api/payments | List / Process payment |
| GET/POST | /api/funding-requests | List / Create request |
| PUT | /api/funding-requests/:id/approve | Approve request |
| PUT | /api/funding-requests/:id/reject | Reject request |
| PUT | /api/funding-requests/:id/disburse | Disburse funds |
| GET/POST | /api/material-requests | List / Create request |
| PUT | /api/material-requests/:id/status | Update status |
| GET/POST | /api/logbooks | List / Submit logbook |
| GET/POST | /api/safety-reports | List / Report incident |
| GET | /api/reports/summary | Dashboard summary |
| GET | /api/reports/payments | Payment reports |
| GET | /api/reports/workers | Worker reports |
| GET | /api/reports/logbooks | Logbook reports |
