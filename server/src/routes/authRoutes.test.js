import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import "dotenv/config";
import { after, before, describe, it } from "node:test";
import express from "express";
import { query } from "../data/db.js";
import authRoutes from "./authRoutes.js";

const originalJwtSecret = process.env.JWT_SECRET;
const originalEmailDomain = process.env.ALLOWED_EMAIL_DOMAIN;
const testEmails = [
  `route.${process.pid}.${randomUUID()}@example.edu.za`,
  `legacy.${process.pid}.${randomUUID()}@example.edu.za`,
];
const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

let server;
let baseUrl;

describe("auth routes", () => {
  before(async () => {
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.ALLOWED_EMAIL_DOMAIN = "example.edu.za";
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/auth`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await query("DELETE FROM users WHERE email = ANY($1)", [testEmails]);

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalEmailDomain === undefined) {
      delete process.env.ALLOWED_EMAIL_DOMAIN;
    } else {
      process.env.ALLOWED_EMAIL_DOMAIN = originalEmailDomain;
    }
  });

  it("registers, logs in, and authenticates the user with the documented routes", async () => {
    const email = testEmails[0];
    const registration = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Route Test",
        email: email.toUpperCase(),
        department: "IT",
        password: "Password123!",
        rePassword: "Password123!",
      }),
    });
    assert.equal(registration.status, 201);

    const login = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "Password123!",
      }),
    });
    assert.equal(login.status, 200);
    const loginBody = await login.json();
    assert.equal(loginBody.user.email, email);
    assert.equal(loginBody.user.password, undefined);
    assert.ok(loginBody.user.user_id);
    assert.ok(loginBody.token);

    const currentUser = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal(currentUser.status, 200);
    const currentUserBody = await currentUser.json();
    assert.equal(currentUserBody.user.user_id, loginBody.user.user_id);
    assert.equal(currentUserBody.user.role, "user");
    assert.equal(currentUserBody.user.department, "it");
  });

  it("keeps the existing signup route working", async () => {
    const email = testEmails[1];
    const response = await fetch(`${baseUrl}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Legacy Route",
        email,
        department: "IT",
        password: "Password123!",
        rePassword: "Password123!",
      }),
    });

    assert.equal(response.status, 201);
  });
});
