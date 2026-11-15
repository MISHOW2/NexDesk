import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import "dotenv/config";
import { afterEach, beforeEach, describe, it } from "node:test";
import * as userService from "./userService.js";
import { query } from "../data/db.js";

const originalJwtSecret = process.env.JWT_SECRET;
const testEmails = new Set();

function uniqueEmail(prefix) {
  const email = `${prefix}.${process.pid}.${randomUUID()}@example.edu.za`;
  testEmails.add(email);
  return email;
}

describe("userService", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  afterEach(async () => {
    for (const email of testEmails) {
      await query("DELETE FROM users WHERE email = $1", [email]);
    }
    testEmails.clear();
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it("registers a valid user", async () => {
    const email = uniqueEmail("test");
    const newUser = await userService.registerUser({
      name: "Test User",
      email: `${email.toUpperCase()} `,
      department: "IT",
      password: "Password123!",
      rePassword: "Password123!",
    });

    assert.equal(newUser.name, "Test User");
    assert.equal(newUser.email, email);
    assert.equal(newUser.department, "it");
    assert.equal(newUser.role, "user");
    assert.notEqual(newUser.password, "Password123!");
    assert.ok(newUser.user_id > 0);
  });

  it("throws when registering a user with an existing email", async () => {
    const email = uniqueEmail("duplicate");
    await userService.registerUser({
      name: "Existing User",
      email,
      department: "IT",
      password: "Password123!",
      rePassword: "Password123!",
    });

    await assert.rejects(
      userService.registerUser({
        name: "Duplicate User",
        email,
        department: "IT",
        password: "Password123!",
        rePassword: "Password123!",
      }),
      { message: "Registration failed, please contact administrator" }
    );
  });

  it("normalizes concurrent duplicate registrations to the generic registration error", async () => {
    const email = uniqueEmail("concurrent-duplicate");
    const registration = {
      name: "Concurrent User",
      email,
      department: "IT",
      password: "Password123!",
      rePassword: "Password123!",
    };

    const results = await Promise.allSettled([
      userService.registerUser(registration),
      userService.registerUser(registration),
    ]);

    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    const failure = results.find((result) => result.status === "rejected");
    assert.equal(failure.reason.message, "Registration failed, please contact administrator");
  });

  it("throws when registering with an invalid department", async () => {
    await assert.rejects(
      userService.registerUser({
        name: "Bad Department",
        email: "baddept@example.edu.za",
        department: "marketing",
        password: "Password123!",
        rePassword: "Password123!",
      }),
      { message: "Invalid department" }
    );
  });

  it("rejects passwords that are too short or exceed bcrypt's byte limit", async () => {
    await assert.rejects(
      userService.registerUser({
        name: "Short Password",
        email: uniqueEmail("short-password"),
        department: "IT",
        password: "Aa1!short",
        rePassword: "Aa1!short",
      }),
      { message: /at least 10 characters/ }
    );

    const longPassword = "é".repeat(37);
    await assert.rejects(
      userService.registerUser({
        name: "Long Password",
        email: uniqueEmail("long-password"),
        department: "IT",
        password: longPassword,
        rePassword: longPassword,
      }),
      { message: /72 UTF-8 bytes/ }
    );
  });

  it("logs in an existing user with the correct password", async () => {
    const email = uniqueEmail("login");
    const registered = await userService.registerUser({
      name: "Login User",
      email,
      department: "IT",
      password: "Secret123!",
      rePassword: "Secret123!",
    });

    const { user, token } = await userService.userLogin({
      email,
      password: "Secret123!",
    });

    assert.equal(user.email, registered.email);
    assert.equal(typeof token, "string");
  });

  it("throws when login password is incorrect", async () => {
    const email = uniqueEmail("wrong-password");
    await userService.registerUser({
      name: "Password Test",
      email,
      department: "IT",
      password: "CorrectPassword123!",
      rePassword: "CorrectPassword123!",
    });

    await assert.rejects(
      userService.userLogin({
        email,
        password: "WrongPassword",
      }),
      { message: "Invalid email or password" }
    );
  });
});
