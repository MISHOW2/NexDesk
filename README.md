# Nex Desk

TicketFlow is an IT helpdesk project with a React frontend and an Express API. The client uses the API for authentication and supported ticket operations; user and ticket data are stored in PostgreSQL. Browser `localStorage` retains the signed-in session and UI preferences. Some features without API endpoints remain client-side only.

## Requirements

- Node.js and npm

## Run the frontend

In a terminal:

```powershell
cd client
npm install
npm run dev
```

Open the localhost URL printed by Vite. By default, the client uses the deployed API at `https://nexdesk-iamc.onrender.com/api`. To use a local API instead, set `VITE_API_URL=http://localhost:5000/api` in `client/.env`.

## Run the backend API locally

In a separate terminal:

```powershell
cd server
npm install
```

Configure `server/.env` as described in [server/README.md](./server/README.md), then start the API:

```powershell
npm run dev
```

The API listens on `PORT` (5000 by default). Run the backend tests from `server` with:

```powershell
npm test
```

The API provides authentication and ticket endpoints. See [server/README.md](./server/README.md) for routes, database setup, and current limitations.

## Project layout

```text
client/                 React + Vite demo frontend
  src/                  Frontend UI and styles
server/                 Express API prototype
  src/
    constants/          Shared backend constants
    controllers/        HTTP request handlers
    data/               PostgreSQL connection pool
    middlewares/        Request and authentication middleware
    repositories/       Data access layer
    routes/             API route definitions and route tests
    services/           Application logic and service tests
    validation/         Backend input validation
README.md               Setup and project status
ROADMAP.md              Learning and feature milestones
```

## Configuration and safety

The backend reads `PORT`, `JWT_SECRET`, `ALLOWED_EMAIL_DOMAIN`, and its PostgreSQL connection settings from `server/.env`. Never commit `.env` or expose database credentials. The frontend uses `VITE_API_URL` to override its default API URL.

This project is still under development. Some frontend features are not yet synchronized with the API. Review the backend limitations and deployment security before production use.
