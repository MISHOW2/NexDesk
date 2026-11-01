# TicketFlow

TicketFlow is an IT helpdesk project with a React demo frontend and an Express API prototype. The frontend and backend are currently separate: the frontend uses browser `localStorage` and does not call the API. Backend data is held in memory and resets when the server restarts. PostgreSQL is planned for a later learning milestone.

## Requirements

- Node.js and npm

## Run the frontend demo

In a terminal:

```powershell
cd client
npm install
npm run dev
```

Open the localhost URL printed by Vite. The sign-in accounts and application data are demo-only and stored in the browser; do not enter real credentials or confidential ticket information.

## Run the backend API prototype

In a separate terminal:

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Edit `server/.env` and set `JWT_SECRET` to a private development secret. Then start the API:

```powershell
npm run dev
```

The API listens on the port set by `PORT` (3000 in the example configuration). Run the backend tests from `server` with:

```powershell
npm test
```

The API currently has authentication routes (`/api/auth/register`, `/api/auth/login`, and `/api/auth/me`) and ticket route work in progress. It is not connected to the demo frontend, and its in-memory data is not durable. Do not use it to store real user or ticket data.

## Project layout

```text
client/                 React + Vite demo frontend
  src/                  Frontend UI and styles
server/                 Express API prototype
  src/
    constants/          Shared backend constants
    controllers/        HTTP request handlers
    data/               In-memory prototype data
    middlewares/        Request and authentication middleware
    repositories/       Data access layer
    routes/             API route definitions and route tests
    services/           Application logic and service tests
    validation/         Backend input validation
README.md               Setup and project status
ROADMAP.md              Learning and feature milestones
```

## Configuration and safety

The backend reads `PORT`, `JWT_SECRET`, and `ALLOWED_EMAIL_DOMAIN` from `server/.env`. Use `server/.env.example` as a starting point; never commit `.env` or put a real secret in the example file. The frontend currently has no environment configuration because it does not call the backend.

This project is still under development. The backend has no database yet, and frontend demo authentication is not real authentication. Before production use, connect the frontend to the API, add durable storage and authorization, and review deployment security.
