# NexDesk — React IT Helpdesk

A redesigned responsive ticket management frontend inspired by the supplied TicketFlow screens, with a new dark midnight-navy visual identity.

## Run locally

1. Open this folder in VS Code.
2. Open Terminal and run `npm install`.
3. Run `npm run dev`.
4. Open the localhost URL printed in the terminal.

Demo account: **admin@nexdesk.demo** with any password of at least four characters. This is a frontend demonstration, not real authentication.

## Features

- Sign in and register UI (demo-only authentication)
- Responsive dashboard, live ticket statistics and activity
- Ticket list, search, status/priority/category filters
- New ticket form with priority selection
- Ticket details, editable status/assignment, and comments
- User directory and admin role editing
- Browser localStorage persistence

## Important

All data and sign-in state are stored **only in your browser**, not on a server. Do not use real credentials or confidential ticket information. For production, add a secure backend, database, role authorization, password hashing, and API validation.

## v2 additions

- Dark midnight-navy theme with Lucide icons throughout
- **Role-based experience:** Users get a personal dashboard (own tickets, resolution ring, service status, quick actions); Agents/Admins get the staff dashboard
- New pages: Knowledge base, Reports (agents/admins), Settings (profile + notifications)
- Tickets now record who reported them; Users only see their own tickets and cannot change status/assignee
- Admins can delete tickets; one-click demo accounts on the sign-in screen (Admin, Agent, User)

## v3 additions (professional edition)

- **Professional palette:** neutral slate + blue accent, light theme by default with a dark theme toggle (saved per browser). Colours live in `src/tokens.css`.
- **Command palette:** press `Ctrl/⌘ + K` to jump to pages, tickets and actions.
- **SLA tracking:** response targets by priority (Urgent 4h, High 8h, Medium 24h, Low 72h) with live "left / breached" indicators.
- **Ticket queue:** sortable columns, saved-style views (Mine, Unassigned, Urgent, SLA breached), pagination, bulk status/assign, CSV export.
- **Ticket detail:** activity timeline, internal notes (staff only), tags, attachments (names only in this demo), priority editing, Assign-to-me / Resolve / Reopen.
- **Dashboards & reports:** 7-day trend line, priority donut, status split, SLA-breach counts.
- **Notifications** driven by real ticket activity, with unread indicator.
- **Smart suggestions** of knowledge-base articles while typing a new ticket; article feedback buttons.
- Real icon set throughout (Lucide, per-category icons) and an SVG favicon.

Run: `npm install` then `npm run dev`. If you copied an old `node_modules` from another computer, delete it first.

## v3.1
- Sidebar scrolls and has a dedicated **Sign out** button (fixes Admin view where it was pushed off-screen).
- **Admin user management:** add users (name, email, department, role), change roles, remove users, and **Assign tickets** to any Agent/Admin from the Manage users page.
