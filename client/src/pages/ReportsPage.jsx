import React from 'react';
import { Activity, Clock3, Download, Gauge, UserX } from 'lucide-react';
import { DonutChart, TrendChart } from '../components/Charts.jsx';
import { exportTicketsCsv, getSlaInfo } from '../utils/ticket.js';

const categories = ['Hardware', 'Network', 'Software', 'Access / Passwords'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const statuses = [
  ['Open', '#3b82f6'],
  ['In progress', '#f59e0b'],
  ['Resolved', '#10b981'],
  ['Closed', '#64748b'],
];

function Breakdown({ title, values, field, tickets }) {
  const total = tickets.length;

  return (
    <section className="panel">
      <div className="panel-head"><div><h3>{title}</h3></div></div>
      <div className="bars">
        {values.map((value, index) => {
          const count = tickets.filter(ticket => ticket[field] === value).length;
          const width = Math.max(2, count / Math.max(total, 1) * 100);
          return (
            <div className="bar-row" key={value}>
              <span>{value}</span>
              <div className="bar-track"><div className={`bar-fill bar-${index % 4}`} style={{ width: `${width}%` }} /></div>
              <strong>{count}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function ReportsPage({ tickets, users }) {
  const total = tickets.length;
  const resolvedTickets = tickets.filter(ticket => ['Resolved', 'Closed'].includes(ticket.status));
  const activeTickets = tickets.filter(ticket => ['Open', 'In progress'].includes(ticket.status));
  const stats = [
    ['Resolution rate', `${Math.round(resolvedTickets.length / Math.max(total, 1) * 100)}%`, Gauge, 'mint'],
    ['Active tickets', activeTickets.length, Activity, 'blue'],
    ['Urgent & active', activeTickets.filter(ticket => ticket.priority === 'Urgent').length, Clock3, 'orange'],
    ['SLA breached', activeTickets.filter(ticket => getSlaInfo(ticket).breached).length, UserX, 'purple'],
  ];
  const staff = users.filter(user => user.role !== 'User');

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow green">INSIGHTS</span><h1>Reports</h1><p>Performance and workload across the service desk.</p></div>
        <button className="btn ghost" onClick={() => exportTicketsCsv(tickets)}><Download size={16} /> Export CSV</button>
      </div>
      <div className="stats">
        {stats.map(([label, value, Icon, color]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><Icon size={21} /></div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <Breakdown title="Tickets by category" values={categories} field="category" tickets={tickets} />
        <Breakdown title="Tickets by priority" values={priorities} field="priority" tickets={tickets} />
      </div>
      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <section className="panel">
          <div className="panel-head"><div><h3>Tickets created</h3><p>Last 7 days</p></div></div>
          <TrendChart tickets={tickets} />
        </section>
        <section className="panel">
          <div className="panel-head"><div><h3>Status split</h3><p>Current distribution</p></div></div>
          <DonutChart data={statuses.map(([label, color]) => ({
            label,
            color,
            value: tickets.filter(ticket => ticket.status === label).length,
          }))} />
        </section>
      </div>
      <section className="panel ticket-panel" style={{ marginTop: 20 }}>
        <div className="panel-head" style={{ padding: '22px 24px 0' }}>
          <div><h3>Agent workload</h3><p>Assigned and resolved tickets per team member</p></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>AGENT</th><th>ROLE</th><th>ACTIVE</th><th>RESOLVED</th></tr></thead>
            <tbody>
              {staff.map(user => (
                <tr key={user.email}>
                  <td><strong>{user.name}</strong><small>{user.email}</small></td>
                  <td><span className={`badge role-${user.role.toLowerCase()}`}>{user.role}</span></td>
                  <td>{activeTickets.filter(ticket => ticket.assignedTo === user.user_id).length}</td>
                  <td>{resolvedTickets.filter(ticket => ticket.assignedTo === user.user_id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
