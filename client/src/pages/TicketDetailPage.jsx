import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  History,
  MessageCircle,
  Paperclip,
  Timer,
} from 'lucide-react';
import Badge from '../components/Badge.jsx';
import { timeAgo, SLA_HOURS, getSlaInfo } from '../utils/ticket.js';

const statuses = ['Open', 'In progress', 'Resolved', 'Closed'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];

export default function TicketDetailPage({ ticket, staff, go, onUpdateStatus }) {
  const [tab, setTab] = useState('conversation');
  const sla = getSlaInfo(ticket);
  const changeStatus = status => onUpdateStatus(ticket.id, status, `Status changed to ${status}`);

  return (
    <>
      <button className="back" onClick={() => go('All tickets')}><ArrowLeft size={17} /> Back to tickets</button>
      <div className="detail-heading">
        <div>
          <span className="eyebrow green">TICKET #{ticket.id}</span>
          <h1>{ticket.title}</h1>
          <div className="detail-badges">
            <Badge kind="status" icon={CircleDot}>{ticket.status}</Badge>
            <Badge kind="priority" icon={AlertCircle}>{ticket.priority}</Badge>
            <span className={`sla ${sla.cls}`}><Timer size={14} /> SLA: {sla.label}</span>
          </div>
        </div>
        {staff && (!['Resolved', 'Closed'].includes(ticket.status)
          ? <button className="btn primary" onClick={() => changeStatus('Resolved')}><CheckCircle2 size={16} /> Resolve</button>
          : <button className="btn ghost" onClick={() => changeStatus('Open')}>Reopen</button>)}
      </div>
      <div className="detail-grid">
        <div>
          <section className="panel detail-panel">
            <h3>Issue description</h3>
            <p>{ticket.description}</p>
            {ticket.attachments.map((file, index) => (
              <div className="attach" key={`${file.name}-${index}`}>
                <Paperclip size={15} />{file.name}<small>{file.size}</small>
              </div>
            ))}
          </section>
          <section className="panel detail-panel comments">
            <div className="tabs-row">
              <button className={tab === 'conversation' ? 'on' : ''} onClick={() => setTab('conversation')}>
                <MessageCircle size={15} /> Conversation ({ticket.comments.length})
              </button>
              <button className={tab === 'activity' ? 'on' : ''} onClick={() => setTab('activity')}>
                <History size={15} /> Activity ({ticket.activity.length})
              </button>
            </div>
            {tab === 'conversation' ? (
              <p className="muted">Comments are not supported by the API yet.</p>
            ) : (
              <div className="timeline">
                {[...ticket.activity].reverse().map((activity, index) => (
                  <div className="tl-item" key={`${activity.ts}-${index}`}>
                    <span className="tl-dot"><History size={14} /></span>
                    <div><strong style={{ fontSize: 13 }}>{activity.text}</strong><p><small>{activity.by} · {timeAgo(activity.ts)}</small></p></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <div>
          <section className="panel detail-panel manage">
            <h3>Manage ticket</h3>
            <label>Status
              <select value={ticket.status} disabled={!staff} onChange={event => changeStatus(event.target.value)}>
                {statuses.map(status => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>Priority
              <select value={ticket.priority} disabled>{priorities.map(priority => <option key={priority}>{priority}</option>)}</select>
            </label>
            <label>Assigned to
              <select value={ticket.assignee} disabled><option>{ticket.assignee}</option></select>
            </label>
            <p className="muted">Priority, assignment, comments, and deletion are not supported by the API yet.</p>
          </section>
          <section className="panel detail-panel">
            <h3>Tags</h3>
            <div className="chips-row"><span className="muted">Tags are not supported by the API yet.</span></div>
          </section>
          <section className="panel detail-panel">
            <h3>Ticket details</h3>
            {[
              ['Reported by', ticket.by],
              ['Category', ticket.category],
              ['Created', ticket.created],
              ['SLA target', `${SLA_HOURS[ticket.priority]} hours`],
              ['Last updated', timeAgo(ticket.activity[ticket.activity.length - 1].ts)],
            ].map(([label, value]) => (
              <div className="detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
