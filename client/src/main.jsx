import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Ticket, Plus, Users, Search, Bell, LogOut, Menu, ArrowUpRight, Clock3, CheckCircle2, AlertCircle, Activity, Settings, ArrowLeft, MessageCircle, ShieldCheck, Headphones, ArrowRight, Trash2, BookOpen, BarChart3, TrendingUp, Sun, Moon, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Paperclip, X, Lock, StickyNote, History, UserCheck, Tag as TagIcon, Flame, Timer, UserRound, FileText, Eye, CircleDot, Zap, UserPlus, ClipboardCheck, Mail, Building2 } from 'lucide-react';
import { UserDashboard, KnowledgeBase, Reports, SettingsPage, greet } from './pages.jsx';
import { Donut, Trend, CommandPalette, slaInfo, exportCsv, catIcon, done, ago, SLA_HOURS } from './ui.jsx';
import './style.css'; import './tokens.css'; import './theme.css'; import './pro.css';

const H = 36e5, now = Date.now();
const seed = [
  { id: 1042, title: 'VPN keeps disconnecting', description: 'The VPN disconnects every 10–15 minutes while working remotely. This is affecting access to shared drives.', category: 'Network', priority: 'High', status: 'In progress', assignee: 'Agent Smith', by: 'Jane Doe', ageH: 30, tags: ['vpn', 'remote'], comments: [{ by: 'Agent Smith', text: 'I am investigating the connection logs.', time: '10:42 AM' }] },
  { id: 1041, title: 'Laptop won’t turn on', description: 'My laptop is not powering on even when plugged in.', category: 'Hardware', priority: 'Urgent', status: 'Open', assignee: 'Unassigned', by: 'Sam Dlamini', ageH: 3, tags: ['laptop'], comments: [] },
  { id: 1040, title: 'Need access to shared drive', description: 'Please grant me access to the marketing shared folder.', category: 'Access request', priority: 'Medium', status: 'Open', assignee: 'Unassigned', by: 'Thandi Mokoena', ageH: 55, tags: [], comments: [] },
  { id: 1039, title: 'Projector not detected in Lab 3', description: 'Projector does not display an image.', category: 'Hardware', priority: 'Medium', status: 'In progress', assignee: 'Agent Smith', by: 'Jane Doe', ageH: 80, tags: ['lab'], comments: [] },
  { id: 1038, title: 'Excel crashes on open', description: 'Excel closes whenever I open a workbook.', category: 'Software', priority: 'Low', status: 'Resolved', assignee: 'Admin User', by: 'Sam Dlamini', ageH: 130, tags: [], comments: [] },
  { id: 1037, title: 'Printer queue stuck on second floor', description: 'Print jobs are stuck in the queue.', category: 'Hardware', priority: 'Medium', status: 'Resolved', assignee: 'Agent Smith', by: 'Thandi Mokoena', ageH: 200, tags: ['printer'], comments: [] },
  { id: 1036, title: 'Monitor flickering', description: 'My monitor flickers intermittently.', category: 'Hardware', priority: 'Low', status: 'Closed', assignee: 'Admin User', by: 'Jane Doe', ageH: 400, tags: [], comments: [] }];
const hydrate = t => { const createdAt = t.createdAt || now - (t.ageH ?? 48) * H; return { tags: [], attachments: [], comments: [], by: 'Admin User', ...t, createdAt, created: t.created || new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), activity: t.activity || [{ text: 'Ticket created', by: t.by || 'System', ts: createdAt }] } };
const people = [{ name: 'Admin User', email: 'admin@nexdesk.demo', department: 'IT', role: 'Admin' }, { name: 'Agent Smith', email: 'agent@nexdesk.demo', department: 'IT', role: 'Agent' }, { name: 'Jane Doe', email: 'jane@nexdesk.demo', department: 'Finance', role: 'User' }, { name: 'Sam Dlamini', email: 'sam@nexdesk.demo', department: 'Operations', role: 'User' }, { name: 'Thandi Mokoena', email: 'thandi@nexdesk.demo', department: 'HR', role: 'User' }];
const navFor = r => r === 'User' ? [['Dashboard', LayoutDashboard, 'My dashboard'], ['All tickets', Ticket, 'My tickets'], ['New ticket', Plus], ['Knowledge base', BookOpen], ['Settings', Settings]] : [['Dashboard', LayoutDashboard], ['All tickets', Ticket], ['Assigned to me', Headphones], ['New ticket', Plus], ['Reports', BarChart3], ['Knowledge base', BookOpen], ['Settings', Settings]];
const status = ['Open', 'In progress', 'Resolved', 'Closed'], priorities = ['Low', 'Medium', 'High', 'Urgent'], cats = ['Hardware', 'Software', 'Network', 'Access request', 'Other'];
const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def } catch { return def } };
const slug = s => s.replaceAll(' ', '-').toLowerCase(), initials = n => n.split(' ').map(x => x[0]).join('').slice(0, 2);
const PAGE = 8;
const Badge = ({ kind, children, icon: I }) => <span className={`badge ${kind}-${slug(children)}`}>{I && <I size={12} />}{children}</span>;
const kb = [['VPN', 'Fixing VPN disconnections'], ['wi-fi', 'Connecting to the office Wi-Fi'], ['password', 'Resetting your password'], ['print', 'Clearing a stuck print queue'], ['laptop', 'Laptop won’t power on'], ['email', 'Setting up email on your phone'], ['phish', 'Spotting phishing emails'], ['drive', 'Requesting shared drive access']];

function App() {
  const [tickets, setTickets] = useState(() => (load('nexdesk-tickets-v3', null) || load('nexdesk-tickets-v2', seed)).map(hydrate));
  const [users, setUsers] = useState(() => load('nexdesk-users', people));
  const [auth, setAuth] = useState(() => load('nexdesk-auth', null));
  const [theme, setTheme] = useState(() => load('nexdesk-theme', 'light'));
  const [page, setPage] = useState('Dashboard'), [selectedId, setSelectedId] = useState(null), [authMode, setAuthMode] = useState('signin');
  const [mobile, setMobile] = useState(false), [query, setQuery] = useState(''), [sf, setSf] = useState('All statuses'), [pf, setPf] = useState('All priorities'), [cat, setCat] = useState('All categories');
  const [view, setView] = useState('all'), [sort, setSort] = useState({ k: 'createdAt', dir: 'desc' }), [pg, setPg] = useState(1), [sel, setSel] = useState([]);
  const [notify, setNotify] = useState(false), [readAt, setReadAt] = useState(() => load('nexdesk-read', 0)), [toast, setToast] = useState(''), [cmd, setCmd] = useState(false);
  const [modal, setModal] = useState(null), [tab, setTab] = useState('conversation'), [draftTitle, setDraftTitle] = useState(''), [files, setFiles] = useState([]);

  useEffect(() => localStorage.setItem('nexdesk-tickets-v3', JSON.stringify(tickets)), [tickets]);
  useEffect(() => localStorage.setItem('nexdesk-users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('nexdesk-auth', JSON.stringify(auth)), [auth]);
  useEffect(() => { localStorage.setItem('nexdesk-theme', JSON.stringify(theme)); document.documentElement.dataset.theme = theme }, [theme]);
  useEffect(() => localStorage.setItem('nexdesk-read', JSON.stringify(readAt)), [readAt]);
  useEffect(() => { const f = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd(c => !c) } }; window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f) }, []);

  const flash = t => { setToast(t); setTimeout(() => setToast(''), 3000) };
  const staff = auth?.role !== 'User';
  const selected = tickets.find(t => t.id === selectedId);
  const go = useCallback(p => { setPage(p); setSelectedId(null); setMobile(false); setQuery(''); setPg(1); setSel([]); setView('all') }, []);
  const openTicket = t => { setSelectedId(t.id); setPage('Ticket detail'); setTab('conversation') };
  const log = (t, text) => [...t.activity, { text, by: auth.name, ts: Date.now() }];
  const update = (id, patch, text, quiet) => { setTickets(a => a.map(t => t.id === id ? { ...t, ...patch, activity: text ? log(t, text) : t.activity } : t)); if (!quiet) flash('Ticket updated successfully') };

  const visible = useMemo(() => tickets.filter(t => staff || t.by === auth?.name), [tickets, auth, staff]);
  const counts = { all: visible.length, mine: visible.filter(t => t.assignee === auth?.name).length, unassigned: visible.filter(t => t.assignee === 'Unassigned' && !done(t)).length, urgent: visible.filter(t => t.priority === 'Urgent' && !done(t)).length, breached: visible.filter(t => slaInfo(t).breached).length };
  const shown = useMemo(() => {
    const f = visible.filter(t => (page !== 'Assigned to me' || t.assignee === auth?.name)
      && (view === 'all' || (view === 'mine' && t.assignee === auth?.name) || (view === 'unassigned' && t.assignee === 'Unassigned' && !done(t)) || (view === 'urgent' && t.priority === 'Urgent' && !done(t)) || (view === 'breached' && slaInfo(t).breached))
      && (!query || `${t.title} ${t.id} ${t.category} ${t.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
      && (sf === 'All statuses' || t.status === sf) && (pf === 'All priorities' || t.priority === pf) && (cat === 'All categories' || t.category === cat));
    const w = { priority: p => priorities.indexOf(p) }; const val = t => sort.k === 'priority' ? w.priority(t.priority) : t[sort.k];
    return [...f].sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1) });
  }, [visible, page, view, query, sf, pf, cat, sort, auth]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE)), rows = shown.slice((pg - 1) * PAGE, pg * PAGE);
  useEffect(() => setPg(1), [query, sf, pf, cat, view]);

  const notes = useMemo(() => {
    if (!auth) return []; const out = [];
    tickets.filter(t => staff ? true : t.by === auth.name).forEach(t => {
      t.activity.slice(-3).forEach(a => { if (a.by !== auth.name) out.push({ id: t.id + '-' + a.ts, t, icon: a.text.startsWith('Status') ? CheckCircle2 : a.text.includes('Assigned') ? UserCheck : Ticket, text: `#${t.id} · ${a.text}`, sub: `${a.by} · ${ago(a.ts)}`, ts: a.ts }) });
      if (staff && slaInfo(t).breached) out.push({ id: t.id + '-sla', t, icon: Flame, text: `#${t.id} has breached its SLA`, sub: t.title, ts: Date.now() - 1 })
    });
    return out.sort((a, b) => b.ts - a.ts).slice(0, 8)
  }, [tickets, auth, staff]);
  const unread = notes.filter(n => n.ts > readAt).length;

  const addUser = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); const email = d.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === email)) { flash('A user with that email already exists'); return }
    setUsers(a => [...a, { name: d.name.trim(), email, department: d.department, role: d.role }]); setModal(null); flash(`${d.name.trim()} added as ${d.role}`)
  };
  const removeUser = u => {
    if (!confirm(`Remove ${u.name}? Their assigned tickets will become unassigned.`)) return;
    setUsers(a => a.filter(x => x.email !== u.email)); setTickets(a => a.map(t => t.assignee === u.name && !done(t) ? { ...t, assignee: 'Unassigned', activity: log(t, `Unassigned (${u.name} removed)`) } : t)); flash(`${u.name} removed`)
  };
  const assignTo = (u, e) => {
    e.preventDefault(); const ids = new FormData(e.currentTarget).getAll('ids').map(Number); if (!ids.length) { flash('Select at least one ticket'); return }
    setTickets(a => a.map(t => ids.includes(t.id) ? { ...t, assignee: u.name, status: t.status === 'Open' ? 'In progress' : t.status, activity: log(t, `Assigned to ${u.name}`) } : t)); setModal(null); flash(`${ids.length} ticket${ids.length > 1 ? 's' : ''} assigned to ${u.name}`)
  };
  const sort_ = k => setSort(s => s.k === k ? { k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { k, dir: 'asc' });
  const Th = ({ k, children }) => <th className="sortable" onClick={() => sort_(k)}>{children}{sort.k === k && (sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</th>;

  const cmdItems = useMemo(() => {
    if (!auth) return [];
    const nav = [...navFor(auth.role), ...(auth.role === 'Admin' ? [['Manage users', Users]] : [])].map(([n, I, l]) => ({ id: 'n' + n, group: 'Go to', icon: I, label: l || n, hint: 'Page', run: () => go(n) }));
    const act = [{ id: 'a1', group: 'Actions', icon: Plus, label: 'Create new ticket', hint: 'N', run: () => go('New ticket') }, { id: 'a2', group: 'Actions', icon: theme === 'dark' ? Sun : Moon, label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`, hint: 'Theme', run: () => setTheme(theme === 'dark' ? 'light' : 'dark') }, { id: 'a3', group: 'Actions', icon: Download, label: 'Export tickets to CSV', hint: 'CSV', run: () => exportCsv(visible) }, { id: 'a4', group: 'Actions', icon: LogOut, label: 'Sign out', hint: '', run: () => { setAuth(null); go('Dashboard') } }];
    return [...act, ...nav, ...visible.map(t => ({ id: 't' + t.id, group: 'Tickets', icon: catIcon[t.category] || Ticket, label: t.title, hint: `#${t.id}`, run: () => openTicket(t) }))]
  }, [auth, theme, visible, go]);

  const sign = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget));
    if (authMode === 'register') { if (users.some(u => u.email === d.email)) { flash('Email already exists'); return } const u = { name: d.name, email: d.email, department: d.department, role: 'User' }; setUsers(a => [...a, u]); setAuth(u) }
    else { const u = users.find(u => u.email.toLowerCase() === d.email.toLowerCase()); if (!u) { flash('Demo account not found. Try admin@nexdesk.demo'); return } setAuth(u) } go('Dashboard')
  };

  const ThemeBtn = () => <button className="theme-btn" title="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>;

  if (!auth) return <div className="auth-shell"><div className="auth-art"><div className="brand light"><span className="brand-icon"><Headphones size={22} /></span><span>NexDesk<span className="brand-dot">.</span></span></div><div className="auth-pitch"><div className="eyebrow">ENTERPRISE SERVICE MANAGEMENT</div><h1>Resolve faster.<br /><em>Work smarter.</em></h1><p>One workspace for requests, SLAs and knowledge — built for modern IT teams.</p><div className="auth-graphic"><div className="float-card"><CheckCircle2 size={19} /> Issue resolved <span>Just now</span></div><div className="float-card second"><Activity size={19} /> SLA compliance <strong>↗ 96%</strong></div></div></div><span className="auth-foot">© 2026 NexDesk. All rights reserved.</span></div>
    <div className="auth-right"><div className="auth-box"><div className="mobile-brand brand"><span className="brand-icon"><Headphones size={22} /></span>NexDesk.</div><span className="pill-top"><span className="pulse" /> SERVICE DESK PLATFORM</span><h2>{authMode === 'signin' ? 'Welcome back' : 'Create your account'}</h2><p className="muted">{authMode === 'signin' ? 'Sign in to your workspace to get started.' : 'Join your team and start managing requests.'}</p>
      <div className="auth-tabs"><button className={authMode === 'signin' ? 'active' : ''} onClick={() => setAuthMode('signin')}>Sign in</button><button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Register</button></div>
      <form onSubmit={sign}>{authMode === 'register' && <><label>Full name<input name="name" placeholder="Your full name" required /></label><label>Department<select name="department">{['IT', 'Finance', 'Operations', 'HR', 'Marketing'].map(d => <option key={d}>{d}</option>)}</select></label></>}<label>Email address<input type="email" name="email" placeholder="name@company.com" required /></label><label>Password<input type="password" name="password" placeholder="Enter your password" minLength="4" required /></label><button className="btn primary full" type="submit">{authMode === 'signin' ? 'Sign in to workspace' : 'Create account'} <ArrowRight size={17} /></button></form>
      <div className="demo-note">Quick demo access — any password works.<div className="demo-accts">{[['Admin', 'admin@nexdesk.demo', ShieldCheck], ['Agent', 'agent@nexdesk.demo', Headphones], ['User', 'jane@nexdesk.demo', UserRound]].map(([l, e, I]) => <button type="button" key={l} onClick={() => { setAuth(users.find(u => u.email === e)); go('Dashboard') }}><I size={15} />{l}</button>)}</div></div></div></div>{toast && <div className="toast">{toast}</div>}</div>;

  const act = tickets.filter(t => !done(t)), mineAll = visible;
  const resolvedPct = Math.round(tickets.filter(done).length / Math.max(tickets.length, 1) * 100);
  const sla = selected && slaInfo(selected);

  return <div className="app">
    <aside className={'sidebar ' + (mobile ? 'mobile-open' : '')}><div className="brand"><span className="brand-icon"><Headphones size={21} /></span><span>NexDesk<span className="brand-dot">.</span><small>SERVICE DESK</small></span></div><div className="nav-caption">WORKSPACE</div>
      <nav>{navFor(auth.role).map(([n, I, l]) => <button key={n} className={(page === n || (page === 'Ticket detail' && n === 'All tickets')) ? 'nav-active' : ''} onClick={() => go(n)}><I size={18} />{l || n}{n === 'All tickets' && <span className="nav-count">{mineAll.length}</span>}</button>)}</nav>
      {auth.role === 'Admin' && <><div className="nav-caption admin-cap">ADMINISTRATION</div><nav><button className={page === 'Manage users' ? 'nav-active' : ''} onClick={() => go('Manage users')}><Users size={18} />Manage users</button></nav></>}
      <div className="sidebar-bottom"><div className="help-box"><div className="help-icon"><Headphones size={21} /></div><strong>Need a hand?</strong><p>Our support team is here to help you.</p><button onClick={() => go('New ticket')}>Get support <ArrowUpRight size={14} /></button></div>
        <button className="profile" title="Open settings" onClick={() => go('Settings')}><span className="avatar">{initials(auth.name)}</span><span className="profile-text"><strong>{auth.name}</strong><small>{auth.role} · {auth.department}</small></span></button>
        <button className="logout-btn" onClick={() => { setAuth(null); go('Dashboard') }}><LogOut size={16} /> Sign out</button></div></aside>
    {mobile && <div className="overlay" onClick={() => setMobile(false)} />}
    <main className="main"><header className="topbar"><button className="icon-btn hamburger" onClick={() => setMobile(!mobile)}><Menu /></button>
      <div className="breadcrumb">Workspace <span>/</span> <strong>{page === 'Ticket detail' ? 'Ticket details' : page}</strong></div>
      <div className="top-actions"><button className="top-search" onClick={() => setCmd(true)}><Search size={15} /> Search or jump to… <kbd>Ctrl K</kbd></button><span className="today">{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span><ThemeBtn />
        <div className="notif-wrap"><button className="icon-btn" onClick={() => { setNotify(!notify); if (!notify) setReadAt(Date.now()) }}><Bell size={20} />{unread > 0 && <i />}</button>
          {notify && <div className="notification"><div className="n-head"><strong>Notifications</strong><button onClick={() => { setNotify(false); go('All tickets') }}>View tickets</button></div>
            {notes.length === 0 && <div className="empty">You’re all caught up.</div>}
            {notes.map(n => <button key={n.id} className={'n-item ' + (n.ts > readAt ? 'unread' : '')} onClick={() => { setNotify(false); openTicket(n.t) }}><span className="n-ico"><n.icon size={15} /></span><span>{n.text}<small>{n.sub}</small></span></button>)}</div>}</div>
        <span className="avatar top-avatar">{initials(auth.name)}</span></div></header>
      <div className="content">
        {page === 'Dashboard' && !staff && <UserDashboard auth={auth} tickets={tickets} go={go} openTicket={openTicket} />}
        {page === 'Dashboard' && staff && <>
          <div className="page-heading"><div><span className="eyebrow green">OVERVIEW</span><h1>{greet()}, {auth.name.split(' ')[0]}</h1><p>Here’s what’s happening across your service desk today.</p></div><div className="toolbar"><button className="btn ghost" onClick={() => exportCsv(tickets)}><Download size={16} /> Export</button><button className="btn primary" onClick={() => go('New ticket')}><Plus size={18} /> Create ticket</button></div></div>
          <div className="welcome-banner"><div><span className="banner-tag">SERVICE PERFORMANCE</span><h2>{counts.breached ? `${counts.breached} ticket${counts.breached > 1 ? 's' : ''} need attention.` : 'Everything is on track.'}</h2><p>{counts.unassigned} unassigned · {counts.urgent} urgent · {act.length} active in total.</p><button onClick={() => { go('All tickets'); setView(counts.breached ? 'breached' : 'unassigned') }}>Review queue <ArrowRight size={16} /></button></div>
            <div className="banner-visual"><div className="orb orb-one" /><div className="orb orb-two" /><div className="banner-tile tile-one"><span>Resolution rate</span><strong>{resolvedPct}%</strong><div className="tiny-line"><TrendingUp size={26} /></div></div><div className="banner-tile tile-two"><CheckCircle2 size={19} /> {counts.breached ? 'Action needed' : 'On track'}</div></div></div>
          <div className="stats">{[{ label: 'Total tickets', value: tickets.length, icon: Ticket, color: 'blue', note: 'Across all categories' }, { label: 'Open requests', value: tickets.filter(t => t.status === 'Open').length, icon: Clock3, color: 'purple', note: 'Waiting for attention' }, { label: 'In progress', value: tickets.filter(t => t.status === 'In progress').length, icon: Activity, color: 'orange', note: 'Being worked on' }, { label: 'SLA breached', value: counts.breached, icon: Flame, color: 'orange', note: 'Past their target time' }].map(s => <div className="stat-card" key={s.label}><div className={'stat-icon ' + s.color}><s.icon size={21} /></div><span>{s.label}</span><strong>{String(s.value).padStart(2, '0')}</strong><small>{s.note}</small></div>)}</div>
          <div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><h3>Tickets created</h3><p>Last 7 days</p></div><span className="panel-tag">Live data</span></div><Trend tickets={tickets} /></section>
            <section className="panel"><div className="panel-head"><div><h3>Active by priority</h3><p>Open and in-progress tickets</p></div></div><Donut data={[['Urgent', '#dc2626'], ['High', '#f97316'], ['Medium', '#6366f1'], ['Low', '#94a3b8']].map(([l, c]) => ({ label: l, color: c, value: act.filter(t => t.priority === l).length }))} /></section></div>
          <div className="dashboard-grid" style={{ marginTop: 20 }}><section className="panel"><div className="panel-head"><div><h3>Ticket overview</h3><p>Breakdown by current status</p></div></div><div className="bars">{status.map((s, i) => { const n = tickets.filter(t => t.status === s).length; return <div className="bar-row" key={s}><span>{s}</span><div className="bar-track"><div className={'bar-fill bar-' + i} style={{ width: `${Math.max(2, n / Math.max(tickets.length, 1) * 100)}%` }} /></div><strong>{n}</strong></div> })}</div></section>
            <section className="panel"><div className="panel-head"><div><h3>Recent activity</h3><p>Latest updates across tickets</p></div><button className="text-link" onClick={() => go('All tickets')}>View all <ArrowUpRight size={15} /></button></div><div className="activity-list">{tickets.flatMap(t => t.activity.map(a => ({ ...a, t }))).sort((a, b) => b.ts - a.ts).slice(0, 5).map((a, i) => <button className="activity-item" key={i} onClick={() => openTicket(a.t)}><span className={'activity-dot ' + slug(a.t.status)} /><span><strong>{a.t.title}</strong><small>#{a.t.id} · {a.text} · {ago(a.ts)}</small></span><ArrowUpRight size={16} /></button>)}</div></section></div></>}

        {(page === 'All tickets' || page === 'Assigned to me') && <>
          <div className="page-heading"><div><span className="eyebrow green">TICKET MANAGEMENT</span><h1>{page === 'Assigned to me' ? 'Assigned to me' : !staff ? 'My tickets' : 'All tickets'}</h1><p>Track, manage and resolve requests in one place.</p></div><div className="toolbar"><button className="btn ghost" onClick={() => exportCsv(shown)}><Download size={16} /> Export CSV</button><button className="btn primary" onClick={() => go('New ticket')}><Plus size={18} /> New ticket</button></div></div>
          <section className="panel ticket-panel">
            <div className="filters"><div className="search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title, ID, tag or category..." /></div>
              <select value={sf} onChange={e => setSf(e.target.value)}><option>All statuses</option>{status.map(x => <option key={x}>{x}</option>)}</select><select value={pf} onChange={e => setPf(e.target.value)}><option>All priorities</option>{priorities.map(x => <option key={x}>{x}</option>)}</select><select value={cat} onChange={e => setCat(e.target.value)}><option>All categories</option>{cats.map(x => <option key={x}>{x}</option>)}</select></div>
            {staff && <div className="views">{[['all', 'All', counts.all], ['mine', 'Assigned to me', counts.mine], ['unassigned', 'Unassigned', counts.unassigned], ['urgent', 'Urgent', counts.urgent], ['breached', 'SLA breached', counts.breached]].map(([k, l, n]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}<b>{n}</b></button>)}</div>}
            {sel.length > 0 && staff && <div className="bulk"><strong>{sel.length} selected</strong>
              <select defaultValue="" onChange={e => { if (!e.target.value) return; sel.forEach(id => update(id, { status: e.target.value }, `Status changed to ${e.target.value}`, true)); flash(`${sel.length} tickets set to ${e.target.value}`); setSel([]); e.target.value = '' }}><option value="">Set status…</option>{status.map(s => <option key={s}>{s}</option>)}</select>
              <select defaultValue="" onChange={e => { if (!e.target.value) return; sel.forEach(id => update(id, { assignee: e.target.value }, `Assigned to ${e.target.value}`, true)); flash(`${sel.length} tickets assigned to ${e.target.value}`); setSel([]); e.target.value = '' }}><option value="">Assign to…</option>{users.filter(u => u.role !== 'User').map(u => <option key={u.email}>{u.name}</option>)}</select>
              <button className="text-link" onClick={() => setSel([])}>Clear</button></div>}
            <div className="table-wrap"><table><thead><tr>{staff && <th style={{ width: 36 }}><input type="checkbox" checked={rows.length > 0 && rows.every(r => sel.includes(r.id))} onChange={e => setSel(e.target.checked ? [...new Set([...sel, ...rows.map(r => r.id)])] : sel.filter(id => !rows.some(r => r.id === id)))} /></th>}<Th k="title">TICKET</Th><Th k="status">STATUS</Th><Th k="priority">PRIORITY</Th><th>SLA</th><Th k="assignee">ASSIGNED TO</Th><Th k="createdAt">CREATED</Th><th></th></tr></thead>
              <tbody>{rows.map(t => {
                const I = catIcon[t.category] || Ticket, s = slaInfo(t); return <tr key={t.id} onClick={() => openTicket(t)}>
                  {staff && <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.includes(t.id)} onChange={e => setSel(e.target.checked ? [...sel, t.id] : sel.filter(x => x !== t.id))} /></td>}
                  <td><div className="tk-cell"><span className="cat-ico"><I size={17} /></span><div><strong>{t.title}</strong><small>#{t.id} · {t.category}{t.attachments.length > 0 && <> · <Paperclip size={11} /> {t.attachments.length}</>}</small></div></div></td>
                  <td><Badge kind="status">{t.status}</Badge></td><td><Badge kind="priority">{t.priority}</Badge></td><td><span className={'sla ' + s.cls}><Timer size={13} />{s.label}</span></td><td>{t.assignee}</td><td>{t.created}</td><td><ArrowUpRight size={17} /></td></tr>
              })}</tbody></table>
              {shown.length === 0 && <div className="empty">No tickets match your filters.</div>}</div>
            <div className="table-footer"><span>Showing {rows.length ? (pg - 1) * PAGE + 1 : 0}–{(pg - 1) * PAGE + rows.length} of {shown.length} tickets <button onClick={() => { setQuery(''); setSf('All statuses'); setPf('All priorities'); setCat('All categories'); setView('all') }}>Clear filters</button></span>
              <div className="pager"><button disabled={pg === 1} onClick={() => setPg(pg - 1)}><ChevronLeft size={15} /></button>{Array.from({ length: pages }, (_, i) => <button key={i} className={pg === i + 1 ? 'on' : ''} onClick={() => setPg(i + 1)}>{i + 1}</button>)}<button disabled={pg === pages} onClick={() => setPg(pg + 1)}><ChevronRight size={15} /></button></div></div>
          </section></>}

        {page === 'New ticket' && <>
          <div className="page-heading"><div><span className="eyebrow green">SUPPORT REQUEST</span><h1>Create a new ticket</h1><p>Tell us what’s happening and we’ll help get it sorted.</p></div></div>
          <div className="form-grid"><section className="panel form-panel"><form onSubmit={e => {
            e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); const ts = Date.now();
            const t = hydrate({ id: Math.max(1042, ...tickets.map(t => t.id)) + 1, title: d.title, description: d.description, category: d.category, priority: d.priority, status: 'Open', by: auth.name, assignee: 'Unassigned', createdAt: ts, tags: [], attachments: files, comments: [], activity: [{ text: 'Ticket created', by: auth.name, ts }] });
            setTickets(a => [t, ...a]); setFiles([]); setDraftTitle(''); flash('Your ticket has been created'); openTicket(t)
          }}>
            <label>Ticket title <span>*</span><input name="title" required placeholder="Briefly describe the issue" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} /></label>
            {draftTitle.length > 2 && kb.filter(([k]) => draftTitle.toLowerCase().includes(k.toLowerCase())).slice(0, 2).map(([, a]) => <div className="suggest" key={a}><Zap size={14} /> Suggested article: <button type="button" onClick={() => go('Knowledge base')}>{a} →</button></div>)}
            <label>Description <span>*</span><textarea name="description" required rows="6" placeholder="What happened? What have you already tried?" /></label>
            <label>Category<select name="category">{cats.map(x => <option key={x}>{x}</option>)}</select></label><label>Priority <span className="muted" style={{ fontWeight: 500 }}>— response target shown below each option</span></label>
            <div className="priority-picker">{priorities.map((p, i) => <label key={p}><input type="radio" name="priority" value={p} defaultChecked={i === 1} /><span>{p}<small style={{ display: 'block', fontSize: 10, opacity: .75 }}>{SLA_HOURS[p]}h SLA</small></span></label>)}</div>
            <label>Attachments</label><label className="drop"><input type="file" multiple onChange={e => setFiles([...files, ...[...e.target.files].map(f => ({ name: f.name, size: Math.max(1, Math.round(f.size / 1024)) + ' KB' }))])} /><Paperclip size={18} /><br />Click to attach screenshots or logs</label>
            {files.map((f, i) => <div className="attach" key={i}><FileText size={16} />{f.name}<small>{f.size}</small><button type="button" className="icon-btn" onClick={() => setFiles(files.filter((_, x) => x !== i))}><X size={14} /></button></div>)}
            <div className="form-actions"><button type="button" className="btn secondary" onClick={() => go('All tickets')}>Cancel</button><button className="btn primary" type="submit"><Plus size={17} /> Submit ticket</button></div></form></section>
            <section className="panel guide"><span className="guide-icon"><ShieldCheck size={25} /></span><h3>What happens next?</h3>{[['01', 'Ticket submitted', 'Your request is logged with an SLA target.'], ['02', 'Team assigned', 'An agent will take ownership of your request.'], ['03', 'Work in progress', 'Follow updates and reply in the conversation.'], ['04', 'Issue resolved', 'We’ll close the request once it’s sorted.']].map(a => <div className="guide-step" key={a[0]}><span>{a[0]}</span><div><strong>{a[1]}</strong><p>{a[2]}</p></div></div>)}</section></div></>}

        {page === 'Ticket detail' && selected && <>
          <button className="back" onClick={() => go('All tickets')}><ArrowLeft size={17} /> Back to tickets</button>
          <div className="detail-heading"><div><span className="eyebrow green">TICKET #{selected.id}</span><h1>{selected.title}</h1><div className="detail-badges"><Badge kind="status" icon={CircleDot}>{selected.status}</Badge><Badge kind="priority" icon={AlertCircle}>{selected.priority}</Badge><span className={'sla ' + sla.cls}><Timer size={14} /> SLA: {sla.label}</span></div></div>
            {staff && <div className="toolbar">{selected.assignee !== auth.name && <button className="btn ghost" onClick={() => update(selected.id, { assignee: auth.name, status: selected.status === 'Open' ? 'In progress' : selected.status }, `Assigned to ${auth.name}`)}><UserCheck size={16} /> Assign to me</button>}{!done(selected) ? <button className="btn primary" onClick={() => update(selected.id, { status: 'Resolved' }, 'Status changed to Resolved')}><CheckCircle2 size={16} /> Resolve</button> : <button className="btn ghost" onClick={() => update(selected.id, { status: 'Open' }, 'Ticket reopened')}>Reopen</button>}</div>}</div>
          <div className="detail-grid"><div>
            <section className="panel detail-panel"><h3>Issue description</h3><p>{selected.description}</p>{selected.attachments.map((f, i) => <div className="attach" key={i}><Paperclip size={15} />{f.name}<small>{f.size}</small></div>)}</section>
            <section className="panel detail-panel comments"><div className="tabs-row"><button className={tab === 'conversation' ? 'on' : ''} onClick={() => setTab('conversation')}><MessageCircle size={15} />Conversation ({selected.comments.filter(c => staff || !c.internal).length})</button><button className={tab === 'activity' ? 'on' : ''} onClick={() => setTab('activity')}><History size={15} />Activity ({selected.activity.length})</button></div>
              {tab === 'conversation' ? <>
                {selected.comments.filter(c => staff || !c.internal).length === 0 && <p className="muted">No comments yet. Start the conversation below.</p>}
                {selected.comments.filter(c => staff || !c.internal).map((c, i) => <div className={'comment ' + (c.internal ? 'internal' : '')} key={i}><span className="avatar">{initials(c.by)}</span><div><strong>{c.by}</strong>{c.internal && <span className="tag-internal">INTERNAL NOTE</span>}<small>{c.time}</small><p>{c.text}</p></div></div>)}
                <form onSubmit={e => {
                  e.preventDefault(); const f = e.currentTarget, msg = f.comment.value.trim(); if (!msg) return; const internal = !!f.internal?.checked;
                  update(selected.id, { comments: [...selected.comments, { by: auth.name, text: msg, internal, time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }] }, internal ? 'Added an internal note' : 'Posted a reply'); f.reset()
                }}>
                  <textarea name="comment" placeholder="Write a reply..." rows="4" required />
                  <div className="composer-bar">{staff ? <label><input type="checkbox" name="internal" /><Lock size={14} /> Internal note (hidden from requester)</label> : <span />}<button className="btn primary"><MessageCircle size={16} /> Post</button></div></form></>
                : <div className="timeline">{[...selected.activity].reverse().map((a, i) => <div className="tl-item" key={i}><span className="tl-dot"><History size={14} /></span><div><strong style={{ fontSize: 13 }}>{a.text}</strong><p><small>{a.by} · {ago(a.ts)}</small></p></div></div>)}</div>}
            </section></div>
            <div><section className="panel detail-panel manage"><h3>Manage ticket</h3>
              <label>Status<select value={selected.status} disabled={!staff} onChange={e => update(selected.id, { status: e.target.value }, `Status changed to ${e.target.value}`)}>{status.map(s => <option key={s}>{s}</option>)}</select></label>
              <label>Priority<select value={selected.priority} disabled={!staff} onChange={e => update(selected.id, { priority: e.target.value }, `Priority changed to ${e.target.value}`)}>{priorities.map(s => <option key={s}>{s}</option>)}</select></label>
              <label>Assigned to<select value={selected.assignee} disabled={!staff} onChange={e => update(selected.id, { assignee: e.target.value }, `Assigned to ${e.target.value}`)}><option>Unassigned</option>{users.filter(u => u.role !== 'User').map(u => <option key={u.email}>{u.name}</option>)}</select></label>
              {auth.role === 'Admin' && <button className="btn danger full" onClick={() => { if (!confirm('Delete this ticket permanently?')) return; setTickets(a => a.filter(t => t.id !== selected.id)); flash('Ticket deleted'); go('All tickets') }}><Trash2 size={16} /> Delete ticket</button>}</section>
              <section className="panel detail-panel"><h3>Tags</h3><div className="chips-row">{selected.tags.map(t => <span className="tag" key={t}>{t}{staff && <button onClick={() => update(selected.id, { tags: selected.tags.filter(x => x !== t) }, `Removed tag ${t}`, true)}><X size={11} /></button>}</span>)}
                {staff && <input className="mini-in" placeholder="+ add tag" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { const v = e.target.value.trim().toLowerCase(); if (!selected.tags.includes(v)) update(selected.id, { tags: [...selected.tags, v] }, `Added tag ${v}`, true); e.target.value = '' } }} />}{!staff && selected.tags.length === 0 && <span className="muted">No tags</span>}</div></section>
              <section className="panel detail-panel"><h3>Ticket details</h3>{[['Reported by', selected.by], ['Category', selected.category], ['Created', selected.created], ['SLA target', `${SLA_HOURS[selected.priority]} hours`], ['Last updated', ago(selected.activity[selected.activity.length - 1].ts)]].map(a => <div className="detail-row" key={a[0]}><span>{a[0]}</span><strong>{a[1]}</strong></div>)}</section></div></div></>}

        {page === 'Manage users' && <>
          <div className="page-heading"><div><span className="eyebrow green">TEAM DIRECTORY</span><h1>Manage users</h1><p>Add team members, set their roles and assign tickets for them to resolve.</p></div><div className="toolbar"><span className="users-count">{users.length} team members</span><button className="btn primary" onClick={() => setModal({ type: 'add' })}><UserPlus size={17} /> Add user</button></div></div>
          <section className="panel ticket-panel"><div className="filters"><div className="search-box"><Search size={18} /><input placeholder="Search team members..." value={query} onChange={e => setQuery(e.target.value)} /></div></div>
            <div className="table-wrap"><table><thead><tr><th>TEAM MEMBER</th><th>DEPARTMENT</th><th>ROLE</th><th>ACTIVE TICKETS</th><th>CHANGE ROLE</th><th>ACTIONS</th></tr></thead><tbody>{users.filter(u => `${u.name} ${u.email} ${u.department}`.toLowerCase().includes(query.toLowerCase())).map(u => {
              const isStaff = u.role !== 'User', n = tickets.filter(t => !done(t) && (isStaff ? t.assignee === u.name : t.by === u.name)).length; return <tr key={u.email}>
                <td><div className="user-cell"><span className="avatar">{initials(u.name)}</span><div><strong>{u.name}</strong><small style={{ display: 'block' }}>{u.email}</small></div></div></td><td>{u.department}</td><td><Badge kind="role">{u.role}</Badge></td>
                <td>{n} <small>{isStaff ? 'assigned' : 'reported'}</small></td>
                <td><select value={u.role} disabled={auth.role !== 'Admin' || u.email === auth.email} onChange={e => { setUsers(a => a.map(x => x.email === u.email ? { ...x, role: e.target.value } : x)); flash(`${u.name} is now ${e.target.value}`) }}>{['User', 'Agent', 'Admin'].map(r => <option key={r}>{r}</option>)}</select></td>
                <td><div className="row-actions"><button className="btn ghost sm" disabled={!isStaff} title={isStaff ? 'Assign tickets' : 'Set role to Agent or Admin to assign tickets'} onClick={() => setModal({ type: 'assign', user: u })}><ClipboardCheck size={14} /> Assign tickets</button><button className="btn ghost sm danger-text" disabled={u.email === auth.email} title="Remove user" onClick={() => removeUser(u)}><Trash2 size={14} /></button></div></td></tr>
            })}</tbody></table></div></section></>}

        {page === 'Knowledge base' && <KnowledgeBase go={go} />}
        {page === 'Reports' && <Reports tickets={tickets} users={users} />}
        {page === 'Settings' && <SettingsPage auth={auth} onSave={p => { setUsers(a => a.map(u => u.email === auth.email ? { ...u, ...p } : u)); setAuth(a => ({ ...a, ...p })); flash('Profile saved') }} />}
      </div></main>
    {modal && <div className="cmd-back" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-head"><h3>{modal.type === 'add' ? 'Add a team member' : `Assign tickets to ${modal.user.name}`}</h3><button className="icon-btn" onClick={() => setModal(null)}><X size={18} /></button></div>
      {modal.type === 'add' ? <form onSubmit={addUser}><label>Full name<input name="name" required placeholder="e.g. Lerato Nkosi" /></label><label>Email address<input type="email" name="email" required placeholder="name@company.com" /></label>
        <div className="two-col"><label>Department<select name="department">{['IT', 'Finance', 'Operations', 'HR', 'Marketing'].map(d => <option key={d}>{d}</option>)}</select></label><label>Role<select name="role" defaultValue="Agent"><option>User</option><option>Agent</option><option>Admin</option></select></label></div>
        <p className="muted" style={{ fontSize: 12 }}>Agents and Admins can resolve tickets. Users can only raise and track their own.</p>
        <div className="form-actions"><button type="button" className="btn secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn primary"><UserPlus size={16} /> Add user</button></div></form>
        : <form onSubmit={e => assignTo(modal.user, e)}><p className="muted" style={{ fontSize: 13 }}>Choose the active tickets {modal.user.name.split(' ')[0]} should resolve.</p>
          <div className="pick-list">{[...tickets].filter(t => !done(t)).sort((a, b) => (a.assignee === 'Unassigned' ? 0 : 1) - (b.assignee === 'Unassigned' ? 0 : 1) || b.createdAt - a.createdAt).map(t => <label className="pick" key={t.id}><input type="checkbox" name="ids" value={t.id} defaultChecked={false} disabled={t.assignee === modal.user.name} /><span><strong>{t.title}</strong><small>#{t.id} · {t.priority} · {t.assignee === modal.user.name ? 'Already assigned' : t.assignee === 'Unassigned' ? 'Unassigned' : 'Currently ' + t.assignee}</small></span><Badge kind="priority">{t.priority}</Badge></label>)}
            {tickets.filter(t => !done(t)).length === 0 && <div className="empty">No active tickets to assign.</div>}</div>
          <div className="form-actions"><button type="button" className="btn secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn primary"><ClipboardCheck size={16} /> Assign selected</button></div></form>}</div></div>}
    <CommandPalette open={cmd} onClose={() => setCmd(false)} items={cmdItems} />
    {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}</div>;
}
createRoot(document.getElementById('root')).render(<App />);
