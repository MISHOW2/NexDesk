import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import express from "express";
import { users } from "../data/users.js";
import authRoutes from "./authRoutes.js";

const originalUsers = users.map((user) => ({ ...user }));
const originalJwtSecret = process.env.JWT_SECRET;
const originalEmailDomain = process.env.ALLOWED_EMAIL_DOMAIN;
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
    users.length = 0;
    originalUsers.forEach((user) => users.push({ ...user }));

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
    const registration = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Route Test",
        email: "Route.Test@Example.edu.za",
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
        email: "route.test@example.edu.za",
        password: "Password123!",
      }),
    });
    assert.equal(login.status, 200);
    const loginBody = await login.json();
    assert.equal(loginBody.user.email, "route.test@example.edu.za");
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
  });

  it("keeps the existing signup route working", async () => {
    const response = await fetch(`${baseUrl}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Legacy Route",
        email: "legacy@example.edu.za",
        department: "IT",
        password: "Password123!",
        rePassword: "Password123!",
      }),
    });

    assert.equal(response.status, 201);
  });
});
