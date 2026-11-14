# TicketFlow client

The client uses React and Vite. Its source is organized by responsibility:

```text
src/
  App.jsx                 App state, API orchestration, and page selection
  main.jsx                Browser entry point and global styles
  components/             Shared layout, form, badge, chart, and command UI
  config/                 Navigation configuration
  pages/                  Dashboard, ticket, report, knowledge base, and settings views
  services/               Backend API client and response normalization
  styles/                 Base, token, theme, and component styles
  utils/                  Ticket helpers and browser storage
```

Run the client from this folder:

```sh
npm install
npm run dev
npm run build
```

The client defaults to the deployed API at `https://nexdesk-iamc.onrender.com/api`.
Set `VITE_API_URL` to override it. For a local server, use
`http://localhost:5000/api`.
