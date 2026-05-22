# EDI Internal Support Ticketing System

A full-stack internal support ticketing web application built with React (TypeScript), Node.js/Express, and MongoDB.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | Session-based (express-session + connect-mongo) |
| Export | ExcelJS |
| Timezone | All timestamps in IST (Asia/Kolkata) |

---

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm v9+

---

## Setup Instructions

### 1. Clone / Extract the project

```bash
cd support-ticketing
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/support_ticketing
# SESSION_SECRET=your_super_secret_key_here
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

### 4. Run the Application

**Terminal 1 — Start Backend:**
```bash
cd backend
npm run dev        # development (nodemon)
# OR
npm start          # production
```

**Terminal 2 — Start Frontend:**
```bash
cd frontend
npm start
```

The app will be available at: **http://localhost:3000**
Backend API runs on: **http://localhost:5000**

---

## Login Credentials

| Field | Value |
|-------|-------|
| Username | `boomisupport@easydataintegration.net` |
| Password | `EDI@boomisupport` |

---

## Environment Variables

### backend/.env

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/support_ticketing
SESSION_SECRET=your_super_secret_session_key_change_this
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## Features

### Dashboard
- Summary cards: Total, Open, In Progress, On Hold, Resolved, Closed
- Recent 10 tickets table

### Tickets
- Create, Read, Update, Delete tickets
- Auto-incrementing serial number per project (atomic, never repeats)
- Status history timeline (tracks who changed status + when)
- Filters: Project, Status, Technician
- Sorting on all key columns
- Pagination (15 per page)

### Projects
- Create and delete projects
- Unique project names enforced

### Technicians
- Create, update, delete technicians
- Dynamic dropdown in ticket forms

### Export
- Download all tickets for a project as `.xlsx`
- Sorted by serial number (ascending)
- Formatted with color-coded priority columns
- Filename: `<ProjectName>_Tickets.xlsx`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current session |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/technicians` | List technicians |
| POST | `/api/technicians` | Create technician |
| PUT | `/api/technicians/:id` | Update technician |
| DELETE | `/api/technicians/:id` | Delete technician |
| GET | `/api/tickets` | List tickets (with filters/pagination) |
| GET | `/api/tickets/:id` | Get single ticket |
| POST | `/api/tickets` | Create ticket |
| PUT | `/api/tickets/:id` | Update ticket |
| DELETE | `/api/tickets/:id` | Delete ticket |
| GET | `/api/export/tickets/:projectId` | Export tickets as Excel |
| GET | `/api/dashboard/summary` | Dashboard stats |

---

## Data Validation Rules

- Required: `issue`, `assignedTo`, `businessCriticality`, `status`, `executionId`
- `businessCriticality` must be: `P1`, `P2`, `P3`, `P4`
- `status` must be: `Open`, `In Progress`, `On Hold`, `Resolved`, `Closed`
- DateTime format: `YYYY-MM-DD HH:mm:ss` (IST)
- `executionId` must be unique per project (compound index)

---

## Database Design

### Collections
- `users` — Authentication
- `projects` — Project registry
- `technicians` — Support staff
- `tickets` — Support incidents (with `statusHistory[]` audit trail)
- `counters` — Atomic serial number tracking per project

### Key Indexes
- `tickets`: `projectId`, `executionId`, `status`
- `tickets`: Compound unique on `{ executionId, projectId }`

---

## Project Structure

```
support-ticketing/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Technician.js
│   │   ├── Ticket.js
│   │   └── Counter.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── technicians.js
│   │   ├── tickets.js
│   │   ├── export.js
│   │   └── dashboard.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── datetime.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── layout/Layout.tsx
        │   └── tickets/
        │       ├── TicketForm.tsx
        │       └── TicketDetail.tsx
        ├── hooks/useAuth.tsx
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── TicketsPage.tsx
        │   ├── ProjectsPage.tsx
        │   └── TechniciansPage.tsx
        ├── types/index.ts
        ├── utils/api.ts
        ├── App.tsx
        └── index.tsx
```
