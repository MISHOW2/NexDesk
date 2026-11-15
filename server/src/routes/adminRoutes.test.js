import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import "dotenv/config";
import { after, before, describe, it } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { query } from "../data/db.js";
import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";

const originalJwtSecret = process.env.JWT_SECRET;
const accounts = [
  { name: "admin", role: "admin", department: "it" },
  { name: "requester", role: "user", department: "it" },
  { name: "target", role: "user", department: "finance" },
];
const emails = accounts.map(
  ({ name }) => `${name}.${process.pid}.${randomUUID()}@example.edu.za`
);
const userIds = [];
const app = express();
app.use(express.json());
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

let server;
let baseUrl;

const tokenFor = (userId, role, department) =>
  jwt.sign({ user_id: userId, role, department }, process.env.JWT_SECRET, { expiresIn: "1h" });

async function request(path, token, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
}

describe("admin routes", () => {
  before(async () => {
    process.env.JWT_SECRET = "admin-route-test-secret";
    for (let index = 0; index < accounts.length; index += 1) {
      const { name, role, department } = accounts[index];
      const { rows } = await query(
        `INSERT INTO users (name, email, department, password_hash, role)
         VALUES ($1, $2, $3, 'not-used', $4)
         RETURNING user_id`,
        [`Admin test ${name}`, emails[index], department, role]
      );
      userIds.push(Number(rows[0].user_id));
    }

    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await query("DELETE FROM users WHERE email = ANY($1)", [emails]);
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it("restricts user management to admins and applies role changes immediately", async () => {
    const adminToken = tokenFor(userIds[0], "admin", "it");
    const requesterToken = tokenFor(userIds[1], "user", "it");
    const staleAdminToken = tokenFor(userIds[1], "admin", "it");

    assert.equal((await request("/api/admin/users")).status, 401);
    assert.equal((await request("/api/admin/users", requesterToken)).status, 403);
    assert.equal((await request("/api/admin/users", staleAdminToken)).status, 403);

    const listResponse = await request("/api/admin/users", adminToken);
    assert.equal(listResponse.status, 200);
    const listedUsers = (await listResponse.json()).data;
    assert.ok(listedUsers.some((user) => user.user_id === userIds[2]));
    assert.equal("password_hash" in listedUsers[0], false);
    assert.equal("password" in listedUsers[0], false);

    const selfRoleChange = await request(`/api/admin/users/${userIds[0]}`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ role: "user" }),
    });
    assert.equal(selfRoleChange.status, 400);

    const invalidRole = await request(`/api/admin/users/${userIds[2]}`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ role: "owner" }),
    });
    assert.equal(invalidRole.status, 400);

    const updateResponse = await request(`/api/admin/users/${userIds[2]}`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ role: "agent" }),
    });
    assert.equal(updateResponse.status, 200);
    assert.equal((await updateResponse.json()).data.role, "agent");

    const refreshedUserResponse = await request("/api/auth/me", requesterToken);
    assert.equal(refreshedUserResponse.status, 200);
    assert.equal((await refreshedUserResponse.json()).user.role, "user");

    const refreshedAgentToken = tokenFor(userIds[2], "user", "finance");
    const refreshedAgentResponse = await request("/api/auth/me", refreshedAgentToken);
    assert.equal(refreshedAgentResponse.status, 200);
    assert.equal((await refreshedAgentResponse.json()).user.role, "agent");
  });
});
