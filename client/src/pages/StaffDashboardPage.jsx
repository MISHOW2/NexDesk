import React from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  Flame,
  Ticket,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { DonutChart, TrendChart } from '../components/Charts.jsx';
import { exportTicketsCsv, formatSlug, getSlaInfo, isDone, timeAgo } from '../utils/ticket.js';
import { greet } from '../utils/date.js';

const statuses = ['Open', 'In progress', 'Resolved', 'Closed'];
const priorities = [
  ['Urgent', '#dc2626'],
  ['High', '#f97316'],
  ['Medium', '#6366f1'],
  ['Low', '#94a3b8'],
];

export default function StaffDashboardPage({ auth, tickets, go, openTicket, onReviewQueue }) {
  const activeTickets = tickets.filter(ticket => !isDone(ticket));
  const unassignedCount = activeTickets.filter(ticket => ticket.assignee === 'Unassigned').length;
  const urgentCount = activeTickets.filter(ticket => ticket.priority === 'Urgent').length;
  const breachedCount = tickets.filter(ticket => getSlaInfo(ticket).breached).length;
  const resolvedRate = Math.round(tickets.filter(isDone).length / Math.max(tickets.length, 1) * 100);
  const recentActivity = tickets
    .flatMap(ticket => ticket.activity.map(activity => ({ ...activity, ticket })))
    .sort((left, right) => right.ts - left.ts)
    .slice(0, 5);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow green">OVERVIEW</span>
          <h1>{greet()}, {auth.name.split(' ')[0]}</h1>
          <p>Here’s what’s happening across your service desk today.</p>
        </div>
        <div className="toolbar">
          <button className="btn ghost" onClick={() => exportTicketsCsv(tickets)}><Download size={16} /> Export</button>
          <button className="btn primary" onClick={() => go('New ticket')}><Ticket size={18} /> Create ticket</button>
        </div>
      </div>
      <div className="welcome-banner">
        <div>
          <span className="banner-tag">SERVICE PERFORMANCE</span>
          <h2>{breachedCount ? `${breachedCount} ticket${breachedCount > 1 ? 's' : ''} need attention.` : 'Everything is on track.'}</h2>
          <p>{unassignedCount} unassigned · {urgentCount} urgent · {activeTickets.length} active in total.</p>
          <button onClick={() => onReviewQueue(breachedCount ? 'breached' : 'unassigned')}>
            Review queue <ArrowRight size={16} />
          </button>
        </div>
        <div className="banner-visual">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="banner-tile tile-one">
            <span>Resolution rate</span>
            <strong>{resolvedRate}%</strong>
            <div className="tiny-line"><TrendingUp size={26} /></div>
          </div>
          <div className="banner-tile tile-two">
            <CheckCircle2 size={19} /> {breachedCount ? 'Action needed' : 'On track'}
          </div>
        </div>
      </div>
      <div className="stats">
        {[
          ['Total tickets', tickets.length, Ticket, 'blue', 'Across all categories'],
          ['Open requests', tickets.filter(ticket => ticket.status === 'Open').length, Clock3, 'purple', 'Waiting for attention'],
          ['In progress', tickets.filter(ticket => ticket.status === 'In progress').length, Activity, 'orange', 'Being worked on'],
          ['SLA breached', breachedCount, Flame, 'orange', 'Past their target time'],
        ].map(([label, value, Icon, color, note]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><Icon size={21} /></div>
            <span>{label}</span>
            <strong>{String(value).padStart(2, '0')}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head"><div><h3>Tickets created</h3><p>Last 7 days</p></div><span className="panel-tag">Live data</span></div>
          <TrendChart tickets={tickets} />
        </section>
        <section className="panel">
          <div className="panel-head"><div><h3>Active by priority</h3><p>Open and in-progress tickets</p></div></div>
          <DonutChart data={priorities.map(([label, color]) => ({
            label,
            color,
            value: activeTickets.filter(ticket => ticket.priority === label).length,
          }))} />
        </section>
      </div>
      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <section className="panel">
          <div className="panel-head"><div><h3>Ticket overview</h3><p>Breakdown by current status</p></div></div>
          <div className="bars">
            {statuses.map((status, index) => {
              const count = tickets.filter(ticket => ticket.status === status).length;
              const width = Math.max(2, count / Math.max(tickets.length, 1) * 100);
              return (
                <div className="bar-row" key={status}>
                  <span>{status}</span>
                  <div className="bar-track"><div className={`bar-fill bar-${index}`} style={{ width: `${width}%` }} /></div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div><h3>Recent activity</h3><p>Latest updates across tickets</p></div>
            <button className="text-link" onClick={() => go('All tickets')}>View all <ArrowUpRight size={15} /></button>
          </div>
          <div className="activity-list">
            {recentActivity.map((item, index) => (
              <button className="activity-item" key={`${item.ticket.id}-${item.ts}-${index}`} onClick={() => openTicket(item.ticket)}>
                <span className={`activity-dot ${formatSlug(item.ticket.status)}`} />
                <span>
                  <strong>{item.ticket.title}</strong>
                  <small>#{item.ticket.id} · {item.text} · {timeAgo(item.ts)}</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
            {recentActivity.length === 0 && <div className="empty"><Timer size={24} /> No ticket activity yet.</div>}
          </div>
        </section>
      </div>
    </>
  );
}
