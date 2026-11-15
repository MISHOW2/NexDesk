import pool from "../data/db.js";

// The database uses snake_case; the rest of your app expects these field names.
const toUser = (row) =>
  row && {
    user_id: Number(row.user_id),
    name: row.name,
    email: row.email,
    department: row.department,
    password: row.password_hash,
    role: String(row.role).toLowerCase(),
    createdAt: row.created_at,
  };

export async function getUserByEmail(email) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return toUser(rows[0]);
}

export async function getUserById(userId) {
  const { rows } = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
  return toUser(rows[0]);
}

export async function getAllUsers() {
  const { rows } = await pool.query(
    `SELECT user_id, name, email, department, role, created_at AS "createdAt"
     FROM users
     ORDER BY name, user_id`
  );
  return rows.map((row) => ({
    ...row,
    user_id: Number(row.user_id),
    role: String(row.role).toLowerCase(),
  }));
}

export async function getAssignableAgents() {
  const { rows } = await pool.query(
    `SELECT user_id, name, email, department
     FROM users
     WHERE LOWER(role) = 'agent'
     ORDER BY name, user_id`
  );
  return rows.map((row) => ({ ...row, user_id: Number(row.user_id) }));
}

export async function updateUserRole(userId, role) {
  const { rows } = await pool.query(
    `UPDATE users
     SET role = $2
     WHERE user_id = $1
     RETURNING user_id, name, email, department, role, created_at AS "createdAt"`,
    [userId, role]
  );
  const row = rows[0];
  return row && {
    ...row,
    user_id: Number(row.user_id),
    role: String(row.role).toLowerCase(),
  };
}

export async function createUser({ name, email, department, password }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, department, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, email, department, password]
  );
  return toUser(rows[0]);
}