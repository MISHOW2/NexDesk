const API_URL = import.meta.env.VITE_API_URL;

const categoryIds = {
  Hardware: 1,
  Network: 2,
  Software: 3,
  'Access / Passwords': 4,
};
const categoriesById = Object.fromEntries(
  Object.entries(categoryIds).map(([name, id]) => [id, name])
);
const statuses = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`The API returned an invalid response (${response.status}).`);
    }
  }

  if (!response.ok) {
    const error = new Error(body.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export function normalizeUser(user, token) {
  const role = String(user.role || 'user').toLowerCase();
  const department = String(user.department || '');
  const departmentLabels = { it: 'IT', hr: 'HR', finance: 'Finance', safety: 'Safety' };
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    department: departmentLabels[department.toLowerCase()] || department.replace(/\b\w/g, letter => letter.toUpperCase()),
    role: role === 'admin' ? 'Admin' : role === 'agent' ? 'Agent' : 'User',
    token,
  };
}

function normalizeManagedUser(user) {
  const department = String(user.department || '');
  const departmentLabels = { it: 'IT', hr: 'HR', finance: 'Finance', safety: 'Safety' };
  return {
    ...user,
    user_id: Number(user.user_id),
    department: departmentLabels[department.toLowerCase()] || department.replace(/\b\w/g, letter => letter.toUpperCase()),
    role: String(user.role || 'user').toLowerCase(),
  };
}

export function normalizeTicket(ticket, auth) {
  const parsedCreatedAt = new Date(ticket.createdAt).getTime();
  const createdAt = Number.isFinite(parsedCreatedAt) ? parsedCreatedAt : Date.now();
  const createdBy = Number(ticket.createdBy);
  const assignedTo = ticket.assignedTo == null ? null : Number(ticket.assignedTo);
  const categoryId = Number(ticket.categoryId);
  const status = String(ticket.status || 'open').toLowerCase().replaceAll(' ', '_');

  return {
    id: Number(ticket.ticket_id),
    title: ticket.title,
    description: ticket.description,
    category: categoriesById[categoryId] || `Category ${categoryId}`,
    priority: String(ticket.priority || 'Medium').replace(/\b\w/g, letter => letter.toUpperCase()),
    status: statuses[status] || ticket.status,
    assignee: assignedTo == null ? 'Unassigned' : (ticket.assignedToName || `User #${assignedTo}`),
    assignedTo,
    by: createdBy === Number(auth.user_id) ? auth.name : `User #${createdBy}`,
    createdBy,
    createdAt,
    created: new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tags: [],
    attachments: [],
    comments: [],
    activity: [{ text: 'Ticket created', by: createdBy === Number(auth.user_id) ? auth.name : `User #${createdBy}`, ts: createdAt }],
  };
}

export const api = {
  async login(credentials) {
    const body = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (!body.user || typeof body.token !== 'string') {
      throw new Error('The API returned an invalid login response.');
    }
    return normalizeUser(body.user, body.token);
  },

  async register(details) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    });
  },

  async getUsers(auth) {
    const body = await request('/admin/users', { token: auth.token });
    if (!Array.isArray(body.data)) {
      throw new Error('The API returned an invalid user list.');
    }
    return body.data.map(normalizeManagedUser);
  },

  async updateUserRole(auth, userId, role) {
    const body = await request(`/admin/users/${userId}`, {
      method: 'PATCH',
      token: auth.token,
      body: JSON.stringify({ role }),
    });
    if (!body.data || Number(body.data.user_id) !== Number(userId)) {
      throw new Error('The API returned an invalid updated user.');
    }
    return normalizeManagedUser(body.data);
  },

  async getTickets(auth) {
    const limit = 100;
    const tickets = [];
    let offset = 0;

    while (true) {
      const body = await request(`/tickets?limit=${limit}&offset=${offset}`, { token: auth.token });
      if (
        !Array.isArray(body.data)
        || !body.pagination
        || body.pagination.offset !== offset
        || body.pagination.limit !== limit
        || typeof body.pagination.hasMore !== 'boolean'
        || (body.pagination.hasMore && body.data.length === 0)
      ) {
        throw new Error('The API returned an invalid ticket page.');
      }

      tickets.push(...body.data);
      if (!body.pagination.hasMore) break;

      const nextOffset = offset + body.pagination.limit;
      if (!Number.isSafeInteger(nextOffset) || nextOffset <= offset) {
        throw new Error('The API returned invalid pagination details.');
      }
      offset = nextOffset;
    }

    return tickets.map(ticket => normalizeTicket(ticket, auth));
  },

  async getTicketAssignees(auth) {
    const body = await request('/tickets/assignees', { token: auth.token });
    if (!Array.isArray(body.data)) {
      throw new Error('The API returned an invalid agent list.');
    }
    return body.data;
  },

  async assignTicket(auth, ticketId, assignedTo) {
    const body = await request(`/tickets/${ticketId}/assignee`, {
      method: 'PATCH',
      token: auth.token,
      body: JSON.stringify({ assignedTo }),
    });
    if (!body.data) {
      throw new Error('The API returned an invalid assignment response.');
    }
    return normalizeTicket(body.data, auth);
  },

  async createTicket(auth, ticket) {
    const body = await request('/tickets', {
      method: 'POST',
      token: auth.token,
      body: JSON.stringify({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority.toLowerCase(),
        categoryId: categoryIds[ticket.category],
      }),
    });
    if (!body.ticket) {
      throw new Error('The API returned an invalid created ticket.');
    }
    return normalizeTicket(body.ticket, auth);
  },

  async updateTicketStatus(auth, ticketId, status) {
    const body = await request(`/tickets/${ticketId}`, {
      method: 'PATCH',
      token: auth.token,
      body: JSON.stringify({ status: status.toLowerCase().replaceAll(' ', '_') }),
    });
    if (!body.data) {
      throw new Error('The API returned an invalid updated ticket.');
    }
    return normalizeTicket(body.data, auth);
  },
};
