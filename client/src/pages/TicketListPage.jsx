import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Paperclip,
  Plus,
  Search,
  Ticket,
  Timer,
} from 'lucide-react';
import Badge from '../components/Badge.jsx';
import { categoryIcons, exportTicketsCsv, getSlaInfo, isDone } from '../utils/ticket.js';

const pageSize = 8;
const statuses = ['Open', 'In progress', 'Resolved', 'Closed'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const categories = ['Hardware', 'Network', 'Software', 'Access / Passwords'];

export default function TicketListPage({
  tickets,
  auth,
  staff,
  page,
  initialView = 'all',
  loading,
  go,
  onOpenTicket,
  onUpdateStatus,
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [view, setView] = useState(initialView);
  const [sort, setSort] = useState({ key: 'createdAt', direction: 'desc' });
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const currentUserId = Number(auth.user_id);

  const counts = {
    all: tickets.length,
    mine: tickets.filter(ticket => ticket.assignedTo === currentUserId).length,
    unassigned: tickets.filter(ticket => ticket.assignee === 'Unassigned' && !isDone(ticket)).length,
    urgent: tickets.filter(ticket => ticket.priority === 'Urgent' && !isDone(ticket)).length,
    breached: tickets.filter(ticket => getSlaInfo(ticket).breached).length,
  };

  const filteredTickets = useMemo(() => {
    const filtered = tickets.filter(ticket =>
      (page !== 'Assigned to me' || ticket.assignedTo === currentUserId)
      && (
        view === 'all'
        || (view === 'mine' && ticket.assignedTo === currentUserId)
        || (view === 'unassigned' && ticket.assignee === 'Unassigned' && !isDone(ticket))
        || (view === 'urgent' && ticket.priority === 'Urgent' && !isDone(ticket))
        || (view === 'breached' && getSlaInfo(ticket).breached)
      )
      && (!query || `${ticket.title} ${ticket.id} ${ticket.category} ${ticket.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
      && (statusFilter === 'All statuses' || ticket.status === statusFilter)
      && (priorityFilter === 'All priorities' || ticket.priority === priorityFilter)
      && (categoryFilter === 'All categories' || ticket.category === categoryFilter)
    );

    const priorityRank = priority => priorities.indexOf(priority);
    const valueFor = ticket => sort.key === 'priority' ? priorityRank(ticket.priority) : ticket[sort.key];
    return filtered.sort((left, right) => {
      const first = valueFor(left);
      const second = valueFor(right);
      const comparison = first > second ? 1 : first < second ? -1 : 0;
      return comparison * (sort.direction === 'asc' ? 1 : -1);
    });
  }, [tickets, page, currentUserId, view, query, statusFilter, priorityFilter, categoryFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const rows = filteredTickets.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  useEffect(() => setPageNumber(1), [query, statusFilter, priorityFilter, categoryFilter, view]);

  const sortBy = key => setSort(current => current.key === key
    ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : { key, direction: 'asc' });

  const renderSortHeader = (key, label) => (
    <th className="sortable" onClick={() => sortBy(key)}>
      {label}
      {sort.key === key && (sort.direction === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
    </th>
  );

  const setBulkStatus = async event => {
    const nextStatus = event.target.value;
    if (!nextStatus) return;
    await Promise.all(selectedIds.map(id => onUpdateStatus(id, nextStatus, `Status changed to ${nextStatus}`)));
    setSelectedIds([]);
    event.target.value = '';
  };

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('All statuses');
    setPriorityFilter('All priorities');
    setCategoryFilter('All categories');
    setView('all');
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow green">TICKET MANAGEMENT</span>
          <h1>{page === 'Assigned to me' ? 'Assigned to me' : staff ? 'All tickets' : 'My tickets'}</h1>
          <p>Track, manage and resolve requests in one place.</p>
        </div>
        <div className="toolbar">
          <button className="btn ghost" onClick={() => exportTicketsCsv(filteredTickets)}><Download size={16} /> Export CSV</button>
          <button className="btn primary" onClick={() => go('New ticket')}><Plus size={18} /> New ticket</button>
        </div>
      </div>
      <section className="panel ticket-panel">
        <div className="filters">
          <div className="search-box">
            <Search size={18} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by title, ID, tag or category..." />
          </div>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option>All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}
          </select>
          <select value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)}>
            <option>All priorities</option>{priorities.map(priority => <option key={priority}>{priority}</option>)}
          </select>
          <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
            <option>All categories</option>{categories.map(category => <option key={category}>{category}</option>)}
          </select>
        </div>
        {staff && (
          <div className="views">
            {[
              ['all', 'All', counts.all],
              ['mine', 'Assigned to me', counts.mine],
              ['unassigned', 'Unassigned', counts.unassigned],
              ['urgent', 'Urgent', counts.urgent],
              ['breached', 'SLA breached', counts.breached],
            ].map(([key, label, count]) => (
              <button key={key} className={view === key ? 'on' : ''} onClick={() => setView(key)}>
                {label}<b>{count}</b>
              </button>
            ))}
          </div>
        )}
        {selectedIds.length > 0 && staff && (
          <div className="bulk">
            <strong>{selectedIds.length} selected</strong>
            <select defaultValue="" onChange={setBulkStatus}>
              <option value="">Set status…</option>{statuses.map(status => <option key={status}>{status}</option>)}
            </select>
            <button className="text-link" onClick={() => setSelectedIds([])}>Clear</button>
          </div>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {staff && (
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every(row => selectedIds.includes(row.id))}
                      onChange={event => setSelectedIds(event.target.checked
                        ? [...new Set([...selectedIds, ...rows.map(row => row.id)])]
                        : selectedIds.filter(id => !rows.some(row => row.id === id)))}
                    />
                  </th>
                )}
                {renderSortHeader('title', 'TICKET')}
                {renderSortHeader('status', 'STATUS')}
                {renderSortHeader('priority', 'PRIORITY')}
                <th>SLA</th>
                {renderSortHeader('assignee', 'ASSIGNED TO')}
                {renderSortHeader('createdAt', 'CREATED')}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(ticket => {
                const Icon = categoryIcons[ticket.category] || Ticket;
                const sla = getSlaInfo(ticket);
                return (
                  <tr key={ticket.id} onClick={() => onOpenTicket(ticket)}>
                    {staff && (
                      <td onClick={event => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(ticket.id)}
                          onChange={event => setSelectedIds(event.target.checked
                            ? [...selectedIds, ticket.id]
                            : selectedIds.filter(id => id !== ticket.id))}
                        />
                      </td>
                    )}
                    <td>
                      <div className="tk-cell">
                        <span className="cat-ico"><Icon size={17} /></span>
                        <div>
                          <strong>{ticket.title}</strong>
                          <small>
                            #{ticket.id} · {ticket.category}
                            {ticket.attachments.length > 0 && <> · <Paperclip size={11} /> {ticket.attachments.length}</>}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td><Badge kind="status">{ticket.status}</Badge></td>
                    <td><Badge kind="priority">{ticket.priority}</Badge></td>
                    <td><span className={`sla ${sla.cls}`}><Timer size={13} />{sla.label}</span></td>
                    <td>{ticket.assignee}</td>
                    <td>{ticket.created}</td>
                    <td><ArrowUpRight size={17} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTickets.length === 0 && (
            <div className="empty">{loading ? 'Loading tickets…' : 'No tickets match your filters.'}</div>
          )}
        </div>
        <div className="table-footer">
          <span>
            Showing {rows.length ? (pageNumber - 1) * pageSize + 1 : 0}–{(pageNumber - 1) * pageSize + rows.length} of {filteredTickets.length} tickets
            <button onClick={clearFilters}>Clear filters</button>
          </span>
          <div className="pager">
            <button disabled={pageNumber === 1} onClick={() => setPageNumber(value => value - 1)}><ChevronLeft size={15} /></button>
            {Array.from({ length: pageCount }, (_, index) => (
              <button key={index} className={pageNumber === index + 1 ? 'on' : ''} onClick={() => setPageNumber(index + 1)}>
                {index + 1}
              </button>
            ))}
            <button disabled={pageNumber === pageCount} onClick={() => setPageNumber(value => value + 1)}><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>
    </>
  );
}
