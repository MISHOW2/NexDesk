import React from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Cloud,
  Inbox,
  KeyRound,
  LifeBuoy,
  Mail,
  Plus,
  Printer,
  Search,
  Settings,
  Ticket,
  Wifi,
} from 'lucide-react';
import Badge from '../components/Badge.jsx';
import { greet } from '../utils/date.js';

export default function UserDashboard({ auth, tickets, go, openTicket }) {
  const mine = tickets.filter(ticket => ticket.by === auth.name);
  const count = statuses => mine.filter(ticket => statuses.includes(ticket.status)).length;
  const resolved = count(['Resolved', 'Closed']);
  const resolutionRate = Math.round(resolved / Math.max(mine.length, 1) * 100);
  const stats = [
    ['My tickets', mine.length, Ticket, 'mint', 'Submitted by you'],
    ['Open', count(['Open']), Clock3, 'blue', 'Waiting for an agent'],
    ['In progress', count(['In progress']), Activity, 'orange', 'Being worked on'],
    ['Resolved', resolved, CheckCircle2, 'purple', 'Successfully handled'],
  ];
  const quickLinks = [
    [Plus, 'Create ticket', 'Report a new issue', 'New ticket'],
    [Ticket, 'My tickets', 'Track your requests', 'All tickets'],
    [BookOpen, 'Knowledge base', 'Find quick answers', 'Knowledge base'],
    [Settings, 'Account settings', 'Profile and alerts', 'Settings'],
  ];
  const services = [
    [Mail, 'Email & calendar', 'Operational'],
    [Wifi, 'Office Wi-Fi', 'Operational'],
    [KeyRound, 'VPN access', 'Degraded'],
    [Printer, 'Printing', 'Operational'],
    [Cloud, 'Shared drives', 'Operational'],
  ];
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow green">MY DASHBOARD</span>
          <h1>{greet()}, {auth.name.split(' ')[0]}</h1>
          <p>Track your requests and find help without waiting in a queue.</p>
        </div>
        <button className="btn primary" onClick={() => go('New ticket')}><Plus size={18} /> Create ticket</button>
      </div>
      <div className="welcome-banner user-hero">
        <div>
          <span className="banner-tag">IT HELP CENTRE</span>
          <h2>How can we help you today?</h2>
          <p>Search common fixes or raise a ticket and our team will pick it up.</p>
          <button className="hero-search" onClick={() => go('Knowledge base')}>
            <Search size={17} /> Search the knowledge base <ArrowRight size={15} />
          </button>
        </div>
        <div className="banner-visual hero-ring"><LifeBuoy size={120} strokeWidth={1} /></div>
      </div>
      <div className="quick-grid">
        {quickLinks.map(([Icon, title, description, target]) => (
          <button className="quick-card" key={title} onClick={() => go(target)}>
            <span className="stat-icon blue"><Icon size={20} /></span>
            <strong>{title}</strong>
            <small>{description}</small>
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
      <div className="stats">
        {stats.map(([label, value, Icon, color, note]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><Icon size={21} /></div>
            <span>{label}</span>
            <strong>{String(value).padStart(2, '0')}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="user-grid">
        <section className="panel">
          <div className="panel-head">
            <div><h3>My recent tickets</h3><p>Your latest requests and their status</p></div>
            <button className="text-link" onClick={() => go('All tickets')}>View all <ArrowUpRight size={15} /></button>
          </div>
          {mine.length === 0 ? (
            <div className="empty"><Inbox size={30} /><br />You haven’t raised any tickets yet.</div>
          ) : (
            <div className="activity-list">
              {mine.slice(0, 5).map(ticket => (
                <button className="activity-item" key={ticket.id} onClick={() => openTicket(ticket)}>
                  <span>
                    <strong>{ticket.title}</strong>
                    <small>#{ticket.id} · {ticket.category} · {ticket.created}</small>
                  </span>
                  <Badge kind="status">{ticket.status}</Badge>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          )}
        </section>
        <div className="stack">
          <section className="panel ring-panel">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r={radius} className="ring-bg" />
              <circle
                cx="55"
                cy="55"
                r={radius}
                className="ring-fg"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - resolutionRate / 100)}
                transform="rotate(-90 55 55)"
              />
              <text x="55" y="61" textAnchor="middle">{resolutionRate}%</text>
            </svg>
            <div><h3>Resolution rate</h3><p>{resolved} of {mine.length} of your tickets are resolved.</p></div>
          </section>
          <section className="panel">
            <div className="panel-head"><div><h3>Service status</h3><p>Live health of company services</p></div></div>
            <div className="status-list">
              {services.map(([Icon, label, status]) => (
                <div key={label}>
                  <Icon size={17} />
                  <span>{label}</span>
                  <em className={status === 'Operational' ? 'ok' : 'warn'}>{status}</em>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
