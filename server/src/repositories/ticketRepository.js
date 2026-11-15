import { query } from "../data/db.js";
import pool from "../data/db.js";
import { canManageTickets } from "../utils/ticketAccess.js";

const ticketColumns = `
  tickets.ticket_id,
  tickets.title,
  tickets.description,
  tickets.status,
  tickets.priority,
  tickets.category_id AS "categoryId",
  tickets.created_by AS "createdBy",
  tickets.assigned_to AS "assignedTo",
  tickets.created_at AS "createdAt",
  tickets.updated_at AS "updatedAt",
  tickets.resolved_at AS "resolvedAt"
`;

const ticketReturningColumns = `
  ticket_id,
  title,
  description,
  status,
  priority,
  category_id AS "categoryId",
  created_by AS "createdBy",
  assigned_to AS "assignedTo",
  created_at AS "createdAt",
  updated_at AS "updatedAt",
  resolved_at AS "resolvedAt"
`;

const ticketSelect = `
  SELECT ${ticketColumns},
         assigned_user.name AS "assignedToName"
  FROM tickets
  LEFT JOIN users AS assigned_user ON assigned_user.user_id = tickets.assigned_to
`;

function parseTicketId(ticketId) {
  const parsedId = Number(ticketId);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
}

export async function insertTicket({
  title,
  description,
  priority,
  categoryId,
  createdBy,
}) {
  const result = await query(
    `INSERT INTO tickets (title, description, priority, category_id, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${ticketReturningColumns}`,
    [title, description, priority, categoryId, createdBy]
  );

  return result.rows[0];
}

export async function getAllTickets(user, { limit = 50, offset = 0 } = {}) {
  const canManage = canManageTickets(user);
  const result = await query(
    `${ticketSelect}
     WHERE $2 OR created_by = $1
     ORDER BY tickets.ticket_id DESC
     LIMIT $3 OFFSET $4`,
    [user.user_id, canManage, limit + 1, offset]
  );
  const hasMore = result.rows.length > limit;
  if (hasMore) result.rows.pop();
  return { tickets: result.rows, hasMore };
}

export async function getTicketById(ticketId, user) {
  const id = parseTicketId(ticketId);
  if (id === null) {
    return undefined;
  }

  const canManage = canManageTickets(user);
  const result = await query(
    `${ticketSelect}
     WHERE tickets.ticket_id = $1
       AND ($3 OR created_by = $2)`,
    [id, user.user_id, canManage]
  );
  return result.rows[0];
}

export async function updateStatus(ticketId, status, changedBy) {
  const id = parseTicketId(ticketId);
  if (id === null) {
    return undefined;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const previous = await client.query(
      "SELECT status FROM tickets WHERE ticket_id = $1 FOR UPDATE",
      [id]
    );
    if (!previous.rows[0]) {
      await client.query("ROLLBACK");
      return undefined;
    }

    await client.query(
      `UPDATE tickets
       SET status = $2,
           updated_at = NOW(),
           resolved_at = CASE
             WHEN $2 = 'resolved' THEN COALESCE(resolved_at, NOW())
             ELSE NULL
           END
       WHERE ticket_id = $1`,
      [id, status]
    );

    if (previous.rows[0].status !== status) {
      await client.query(
        `INSERT INTO ticket_status_history
           (ticket_id, changed_by, previous_status, new_status)
         VALUES ($1, $2, $3, $4)`,
        [id, changedBy, previous.rows[0].status, status]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch((rollbackError) => {
      console.error("Unable to roll back ticket status update:", rollbackError);
    });
    throw error;
  } finally {
    client.release();
  }

  return getTicketDetailsById(id);
}

async function getTicketDetailsById(ticketId) {
  const result = await query(
    `${ticketSelect}
     WHERE tickets.ticket_id = $1`,
    [ticketId]
  );
  return result.rows[0];
}

export async function assignTicket(ticketId, assignedTo) {
  const id = parseTicketId(ticketId);
  if (id === null) {
    return undefined;
  }

  const result = await query(
    `UPDATE tickets
     SET assigned_to = $2,
         updated_at = NOW()
     WHERE ticket_id = $1
       AND ($2::INTEGER IS NULL OR EXISTS (
         SELECT 1 FROM users
         WHERE user_id = $2 AND LOWER(role) = 'agent'
       ))
     RETURNING ticket_id`,
    [id, assignedTo]
  );

  if (!result.rows[0]) {
    const ticketExists = await query(
      "SELECT 1 FROM tickets WHERE ticket_id = $1",
      [id]
    );
    if (ticketExists.rows[0]) {
      const error = new Error("Tickets can only be assigned to agents");
      error.code = "INVALID_ASSIGNEE";
      throw error;
    }
    return undefined;
  }

  return getTicketDetailsById(id);
}
