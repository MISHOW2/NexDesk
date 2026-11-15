# TicketFlow API

Express API for the TicketFlow helpdesk project.

- **Deployed API:** https://ticket-flow-server-ruddy.vercel.app
- **Health check:** `GET /`

The API is a learning prototype. Users and tickets are stored in PostgreSQL. Do not use it for real accounts or confidential support data.

## Requirements

- Node.js
- npm

## Run locally

From the repository root:

```sh
cd server
npm install
```

Create `server/.env` with:

```env
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
ALLOWED_EMAIL_DOMAIN=example.edu.za
CLIENT_ORIGINS=http://localhost:5173
DATABASE_URL=postgresql://postgres:your-postgres-password@localhost:5432/ticketflow
```

For local PostgreSQL, create a database named `ticketflow` and set `DATABASE_URL` to its connection string. Alternatively, configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.

For Supabase, use the **Shared pooler** connection string from **Connect** and set it as `DATABASE_URL` in `server/.env` and in your hosting provider's environment settings. For the current `pg-connection-string` compatibility behavior, append `?uselibpqcompat=true&sslmode=require` (or `&uselibpqcompat=true` if the URL already has query parameters). This encrypts the connection but does not verify the server certificate; for certificate verification, download the Supabase CA certificate and configure `sslmode=verify-full` with `sslrootcert`. Keep the database password private and do not commit `.env`. For a new database, apply SQL files `001`, `002`, then `003` under `server/sql`. For an existing database, apply only `003_ticket_integrity_and_history.sql`; it is safe to rerun. The server checks its PostgreSQL connection before listening and reports an error if it cannot connect.

Use a private, randomly generated `JWT_SECRET`; never commit your `.env` file. Set `ALLOWED_EMAIL_DOMAIN` to the email domain allowed to register (without the `@`). Then start the API:

Set `CLIENT_ORIGINS` to a comma-separated list of exact frontend origins (scheme, host, and optional port; no path). In production, include your deployed frontend origin. The local default is `http://localhost:5173`. On Vercel, the API trusts one proxy hop for correct client-IP rate limiting.

The third migration adds foreign keys, validation constraints, indexes, and status history; check for invalid or orphaned existing rows before applying it.

```sh
npm run dev
```

The local API is available at `http://localhost:5000`. To run tests:

```sh
npm test
```

The client uses `VITE_API_URL` as the API base URL, including `/api` (for example, `http://localhost:5000/api`). Set it to the local URL when testing against a local server.

## Authentication API

All routes are mounted under `/api/auth`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/register` | Register a user |
| `POST` | `/signup` | Alias retained for existing clients |
| `POST` | `/login` | Verify credentials and return a JWT |
| `GET` | `/me` | Validate a JWT and return the current user ID, role, and department |

### Register

`POST /api/auth/register` (or `/api/auth/signup`) expects JSON:

```json
{
  "name": "Example User",
  "email": "user@example.edu.za",
  "department": "IT",
  "password": "Example123!",
  "rePassword": "Example123!"
}
```

Registration checks the configured email domain, password strength (at least 10 characters and no more than 72 UTF-8 bytes), department, required fields, password confirmation, and duplicate email. Passwords are hashed with bcrypt. Successful registration returns `201` with a confirmation message. Self-registration remains open and email ownership is not verified.

### Login

`POST /api/auth/login` expects:

```json
{
  "email": "user@example.edu.za",
  "password": "Example123!"
}
```

Successful login returns `200` with the user (excluding the password hash) and a JWT that expires after one hour. Invalid credentials return a generic authentication error. Login is limited to 10 attempts per IP per 15 minutes.

### Current user

Send the token from login in the `Authorization` header:

```http
Authorization: Bearer <token>
```

`GET /api/auth/me` validates the token using `JWT_SECRET`.

Registration is limited to five attempts per two-minute window. The same limiter applies to both `/register` and `/signup`.

### User management

All user-management routes require an administrator account. Roles can be `user`, `agent`, or `admin`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/users` | List users without password data |
| `PATCH` | `/api/admin/users/:userId` | Change a user's role with `{ "role": "agent" }` |

New accounts receive the `user` role. To bootstrap the first administrator, register the intended account and promote it directly in PostgreSQL, for example:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.edu.za';
```

The user must sign in again to see the administrator interface. Administrators cannot change their own role. Role changes are read from the database on authenticated API requests, so they take effect server-side immediately.

## Ticket API status

Authenticated ticket endpoints are:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/tickets` | Create a ticket |
| `GET` | `/api/tickets?limit=50&offset=0` | List a page of tickets (maximum `limit`: 100) |
| `GET` | `/api/tickets/assignees` | List agents available for assignment (agents and admins only) |
| `GET` | `/api/tickets/:ticket_id` | Retrieve one ticket |
| `PATCH` | `/api/tickets/:ticket_id` | Update a ticket's `status` |
| `PATCH` | `/api/tickets/:ticket_id/assignee` | Assign to an agent with `{ "assignedTo": 123 }`, or unassign with `{ "assignedTo": null }` |

Ticket categories use these fixed IDs when creating a ticket: `1` Hardware, `2` Network, `3` Software, and `4` Access / Passwords. Priorities are `low`, `medium`, `high`, or `urgent`. Status values are `open`, `in_progress`, `resolved`, and `closed`; the client converts these to display labels. Ticket titles are limited to 200 characters and descriptions to 5,000 characters.

All authenticated users can create tickets. Users can list and retrieve their own tickets, while agents and admins can view all tickets and update ticket statuses.

## Known limitations

- PostgreSQL integration tests require all three SQL files to be applied to the configured test database.
- Status changes are recorded in `ticket_status_history`.
- Email ownership is not verified; open self-registration is retained as requested.
- The login rate limiter uses the default in-memory store; use a shared store if deploying multiple API instances.
- Priority changes, comments, attachments, ticket deletion, profile updates, and notification preferences do not have API endpoints yet and are not synced by the client.
- Configure `JWT_SECRET`, `ALLOWED_EMAIL_DOMAIN`, and `CLIENT_ORIGINS` in the hosting provider's environment settings as well as locally. A local `.env` does not configure the deployed service.
