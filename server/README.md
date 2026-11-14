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
DATABASE_URL=postgresql://postgres:your-postgres-password@localhost:5432/ticketflow
```

For local PostgreSQL, create a database named `ticketflow` and set `DATABASE_URL` to its connection string. Alternatively, configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.

For Supabase, use the **Shared pooler** connection string from **Connect** and set it as `DATABASE_URL` in `server/.env` and in your hosting provider's environment settings. For the current `pg-connection-string` compatibility behavior, append `?uselibpqcompat=true&sslmode=require` (or `&uselibpqcompat=true` if the URL already has query parameters). This encrypts the connection but does not verify the server certificate; for certificate verification, download the Supabase CA certificate and configure `sslmode=verify-full` with `sslrootcert`. Keep the database password private and do not commit `.env`. Apply the schemas from `server/sql/001_create_tickets.sql` and `server/sql/002_create_users.sql` using the Supabase SQL Editor or pgAdmin Query Tool. The server checks its PostgreSQL connection before listening and reports an error if it cannot connect.

Use a private, randomly generated `JWT_SECRET`; never commit your `.env` file. Set `ALLOWED_EMAIL_DOMAIN` to the email domain allowed to register (without the `@`). Then start the API:

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
| `GET` | `/me` | Validate a JWT and return its user ID, role, and department claims |

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

Registration checks the configured email domain, password strength, department, required fields, password confirmation, and duplicate email. Passwords are hashed with bcrypt. Successful registration returns `201` with a confirmation message.

### Login

`POST /api/auth/login` expects:

```json
{
  "email": "user@example.edu.za",
  "password": "Example123!"
}
```

Successful login returns `200` with the user (excluding the password hash) and a JWT that expires after one hour. Invalid credentials return a generic authentication error.

### Current user

Send the token from login in the `Authorization` header:

```http
Authorization: Bearer <token>
```

`GET /api/auth/me` validates the token using `JWT_SECRET`.

Registration is limited to five attempts per two-minute window. The same limiter applies to both `/register` and `/signup`.

## Ticket API status

Authenticated ticket endpoints are:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/tickets` | Create a ticket |
| `GET` | `/api/tickets` | List tickets |
| `GET` | `/api/tickets/:ticket_id` | Retrieve one ticket |
| `PATCH` | `/api/tickets/:ticket_id` | Update a ticket's `status` |

Ticket categories use these fixed IDs when creating a ticket: `1` Hardware, `2` Network, `3` Software, and `4` Access / Passwords. Priorities are `low`, `medium`, `high`, or `urgent`. Status values are `open`, `in_progress`, `resolved`, and `closed`; the client converts these to display labels.

All authenticated users can create tickets. Users can list and retrieve their own tickets, while IT department users, agents, and admins can view all tickets and update ticket statuses.

## Known limitations

- Ticket `created_by` and `assigned_to` are numeric IDs but do not yet have foreign keys.
- PostgreSQL integration tests require both SQL schema files to be applied to the configured test database.
- Priority changes, assignment, comments, attachments, ticket deletion, user management, profile updates, and notification preferences do not have API endpoints yet and are not synced by the client.
- Configure `JWT_SECRET` and `ALLOWED_EMAIL_DOMAIN` in the hosting provider's environment settings as well as locally. A local `.env` does not configure the deployed service.
