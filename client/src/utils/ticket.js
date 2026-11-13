import { AppWindow, Monitor, Wifi, KeyRound } from 'lucide-react';

export const SLA_HOURS = { Urgent: 4, High: 8, Medium: 24, Low: 72 };

export const categoryIcons = {
  Hardware: Monitor,
  Software: AppWindow,
  Network: Wifi,
  'Access / Passwords': KeyRound,
};

export const isDone = ticket => ['Resolved', 'Closed'].includes(ticket.status);

export function getSlaInfo(ticket, now = Date.now()) {
  if (isDone(ticket)) return { cls: 'done', label: 'Met' };

  const due = ticket.createdAt + SLA_HOURS[ticket.priority] * 36e5;
  const left = due - now;
  const hours = Math.abs(left) / 36e5;
  const label = hours < 1
    ? `${Math.round(hours * 60)}m`
    : hours < 48
      ? `${Math.round(hours)}h`
      : `${Math.round(hours / 24)}d`;

  return left < 0
    ? { cls: 'bad', label: `Breached ${label}`, breached: true }
    : left < 36e5 * 3
      ? { cls: 'warn', label: `Due in ${label}` }
      : { cls: 'ok', label: `${label} left` };
}

export const timeAgo = timestamp => {
  const minutes = Math.round((Date.now() - timestamp) / 6e4);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
};

export function exportTicketsCsv(rows) {
  const columns = ['id', 'title', 'category', 'priority', 'status', 'assignee', 'by', 'created'];
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [
    columns.join(','),
    ...rows.map(row => columns.map(column => quote(row[column])).join(',')),
  ].join('\n');

  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = `nexdesk-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export const formatSlug = value => String(value).replaceAll(' ', '-').toLowerCase();
export const getInitials = name => name.split(' ').map(part => part[0]).join('').slice(0, 2);
