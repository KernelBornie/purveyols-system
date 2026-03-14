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
JWT_SECRET=your_secure_secret_here
```

## Demo Accounts

After running `npm run seed`, use these credentials (password: `purveyols123`):

| Role | Email |
|------|-------|
| Director | brian.director@purveyols.com |
| Accountant | micheal.accountant@purveyols.com |
| Engineer | rodney.engineer@purveyols.com |
| Foreman | mobrey.foreman@purveyols.com |
| Driver | boyd.driver@purveyols.com |
| Procurement | gilbert.procurement@purveyols.com |
| Safety Officer | royd.safety@purveyols.com |
| Admin | admin@purveyols.com |

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
│   │   ├── Project.js
│   │   ├── BOQ.js
│   │   └── Subcontract.js
│   ├── routes/                # Express routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── workers.js
│   │   ├── projects.js
│   │   ├── payments.js
│   │   ├── fundingRequests.js
│   │   ├── logbooks.js
│   │   ├── procurement.js
│   │   ├── boq.js
│   │   └── subcontracts.js
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
    │       ├── dashboards/    # Role-specific dashboards
    │       ├── workers/
    │       ├── projects/
    │       ├── funding/
    │       ├── logbooks/
    │       ├── procurement/
    │       ├── payments/
    │       ├── boq/
    │       └── subcontracts/
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
| GET/POST | /api/subcontracts | List / Create subcontract |
| GET | /api/users | List users (director only) |
