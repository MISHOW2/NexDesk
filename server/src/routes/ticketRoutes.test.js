import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import "dotenv/config";
import { after, before, describe, it } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { query } from "../data/db.js";
import ticketRoutes from "./ticketRoutes.js";
import { errorHandler } from "../middlewares/errorHandler.js";

const originalJwtSecret = process.env.JWT_SECRET;
const userIds = [];
const app = express();
app.use(express.json());
app.use("/api/tickets", ticketRoutes);
app.use(errorHandler);

let server;
let baseUrl;
let requesterToken;
let otherUserToken;
let agentToken;
let itUserToken;
let emptyUserToken;

const tokenFor = (userId, role, department) =>
  jwt.sign({ user_id: userId, role, department }, process.env.JWT_SECRET, { expiresIn: "1h" });

async function request(path, token, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
}

describe("ticket routes", () => {
  before(async () => {
    process.env.JWT_SECRET = "ticket-route-test-secret";
    const accounts = [
      { name: "requester", role: "user", department: "finance" },
      { name: "other", role: "user", department: "finance" },
      { name: "empty", role: "user", department: "finance" },
      { name: "agent", role: "agent", department: "finance" },
      { name: "it", role: "user", department: "it" },
    ];
    const emails = accounts.map(
      ({ name }) => `${name}.${process.pid}.${randomUUID()}@example.edu.za`
    );
    for (let index = 0; index < accounts.length; index += 1) {
      const { name, role, department } = accounts[index];
      const { rows } = await query(
        `INSERT INTO users (name, email, department, password_hash, role)
         VALUES ($1, $2, $3, 'not-used', $4)
         RETURNING user_id`,
        [`Ticket ${name}`, emails[index], department, role]
      );
      userIds.push(Number(rows[0].user_id));
    }

    requesterToken = tokenFor(userIds[0], "user", "finance");
    otherUserToken = tokenFor(userIds[1], "user", "finance");
    emptyUserToken = tokenFor(userIds[2], "user", "finance");
    agentToken = tokenFor(userIds[3], "agent", "finance");
    itUserToken = tokenFor(userIds[4], "user", "it");

    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/tickets`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    if (userIds.length) {
      await query("DELETE FROM tickets WHERE created_by = ANY($1)", [userIds]);
      await query("DELETE FROM users WHERE user_id = ANY($1)", [userIds]);
    }
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it("creates tickets, scopes requester reads, and allows staff status updates", async () => {
    const create = (token, title) =>
      request("/", token, {
        method: "POST",
        body: JSON.stringify({
          title,
          description: "Test ticket description",
          priority: "High",
          categoryId: 3,
        }),
      });

    const invalidPriority = await request("/", requesterToken, {
      method: "POST",
      body: JSON.stringify({
        title: "Invalid priority",
        description: "Test ticket description",
        priority: 3,
        categoryId: 3,
      }),
    });
    assert.equal(invalidPriority.status, 400);

    const oversizedTitle = await request("/", requesterToken, {
      method: "POST",
      body: JSON.stringify({
        title: "t".repeat(201),
        description: "Test ticket description",
        priority: "low",
        categoryId: 3,
      }),
    });
    assert.equal(oversizedTitle.status, 400);

    const firstResponse = await create(requesterToken, "Requester ticket");
    const firstBody = await firstResponse.json();
    assert.equal(firstResponse.status, 201, JSON.stringify(firstBody));
    const firstTicket = firstBody.ticket;

    const secondResponse = await create(otherUserToken, "Other user's ticket");
    const secondBody = await secondResponse.json();
    assert.equal(secondResponse.status, 201, JSON.stringify(secondBody));
    const secondTicket = secondBody.ticket;

    const requesterList = await request("/", requesterToken);
    assert.equal(requesterList.status, 200);
    assert.deepEqual((await requesterList.json()).data.map((ticket) => ticket.ticket_id), [firstTicket.ticket_id]);

    const pagedStaffTickets = await request("/?limit=1&offset=0", agentToken);
    assert.equal(pagedStaffTickets.status, 200);
    const pagedBody = await pagedStaffTickets.json();
    assert.equal(pagedBody.data.length, 1);
    assert.equal(pagedBody.pagination.hasMore, true);

    const invalidPageSize = await request("/?limit=0", agentToken);
    assert.equal(invalidPageSize.status, 400);

    const hiddenTicket = await request(`/${secondTicket.ticket_id}`, requesterToken);
    assert.equal(hiddenTicket.status, 404);

    const emptyList = await request("/", emptyUserToken);
    assert.equal(emptyList.status, 200);
    assert.deepEqual((await emptyList.json()).data, []);

    const forbiddenUpdate = await request(`/${firstTicket.ticket_id}`, requesterToken, {
      method: "PATCH",
      body: JSON.stringify({ status: "resolved" }),
    });
    assert.equal(forbiddenUpdate.status, 403);

    const itDepartmentList = await request("/", itUserToken);
    assert.equal(itDepartmentList.status, 200);
    const itTicketIds = (await itDepartmentList.json()).data.map((ticket) => Number(ticket.ticket_id));
    assert.deepEqual(itTicketIds, []);

    const itUpdate = await request(`/${firstTicket.ticket_id}`, itUserToken, {
      method: "PATCH",
      body: JSON.stringify({ status: "resolved" }),
    });
    assert.equal(itUpdate.status, 403);

    const requesterAssignees = await request("/assignees", requesterToken);
    assert.equal(requesterAssignees.status, 403);

    const assigneesResponse = await request("/assignees", agentToken);
    assert.equal(assigneesResponse.status, 200);
    const assignees = (await assigneesResponse.json()).data;
    assert.ok(assignees.some((agent) => agent.user_id === userIds[3]));
    assert.equal(assignees.some((agent) => agent.user_id === userIds[0]), false);

    const staffList = await request("/", agentToken);
    assert.equal(staffList.status, 200);
    const staffTicketIds = (await staffList.json()).data.map((ticket) => Number(ticket.ticket_id));
    assert.ok(staffTicketIds.includes(Number(firstTicket.ticket_id)));
    assert.ok(staffTicketIds.includes(Number(secondTicket.ticket_id)));

    const invalidAssignee = await request(`/${firstTicket.ticket_id}/assignee`, agentToken, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: userIds[0] }),
    });
    assert.equal(invalidAssignee.status, 400);

    const assignment = await request(`/${firstTicket.ticket_id}/assignee`, agentToken, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: userIds[3] }),
    });
    assert.equal(assignment.status, 200);
    const assignedTicket = (await assignment.json()).data;
    assert.equal(assignedTicket.assignedTo, userIds[3]);
    assert.equal(assignedTicket.assignedToName, "Ticket agent");

    const unassignment = await request(`/${firstTicket.ticket_id}/assignee`, agentToken, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: null }),
    });
    assert.equal(unassignment.status, 200);
    assert.equal((await unassignment.json()).data.assignedTo, null);

    const update = await request(`/${firstTicket.ticket_id}`, agentToken, {
      method: "PATCH",
      body: JSON.stringify({ status: "resolved" }),
    });
    assert.equal(update.status, 200);
    assert.equal((await update.json()).data.status, "resolved");

    const history = await query(
      `SELECT previous_status, new_status, changed_by
       FROM ticket_status_history
       WHERE ticket_id = $1`,
      [firstTicket.ticket_id]
    );
    assert.deepEqual(history.rows, [{
      previous_status: "open",
      new_status: "resolved",
      changed_by: userIds[3],
    }]);
  });
});
