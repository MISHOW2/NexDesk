import { query } from "../data/db.js";
import { canManageTickets } from "../utils/ticketAccess.js";

const ticketColumns = `
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
     RETURNING ${ticketColumns}`,
    [title, description, priority, categoryId, createdBy]
  );

  return result.rows[0];
}

export async function getAllTickets(user) {
  const canManage = canManageTickets(user);
  const result = await query(
    `SELECT ${ticketColumns}
     FROM tickets
     WHERE $2 OR created_by = $1
     ORDER BY ticket_id DESC`,
    [user.user_id, canManage]
  );
  return result.rows;
}

export async function getTicketById(ticketId, user) {
  const id = parseTicketId(ticketId);
  if (id === null) {
    return undefined;
  }

  const canManage = canManageTickets(user);
  const result = await query(
    `SELECT ${ticketColumns}
     FROM tickets
     WHERE ticket_id = $1
       AND ($3 OR created_by = $2)`,
    [id, user.user_id, canManage]
  );
  return result.rows[0];
}

export async function updateStatus(ticketId, status) {
  const id = parseTicketId(ticketId);
  if (id === null) {
    return undefined;
  }

  const result = await query(
    `UPDATE tickets
     SET status = $2,
         updated_at = NOW(),
         resolved_at = CASE
           WHEN $2 = 'resolved' THEN COALESCE(resolved_at, NOW())
           ELSE NULL
         END
     WHERE ticket_id = $1
     RETURNING ${ticketColumns}`,
    [id, status]
  );
  return result.rows[0];
}
