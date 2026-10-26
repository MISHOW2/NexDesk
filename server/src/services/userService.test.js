import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import jwt from "jsonwebtoken";
import * as userService from "./userService.js";
import { users } from "../data/users.js";

const originalUsers = users.map((user) => ({ ...user }));
const originalJwtSecret = process.env.JWT_SECRET;

beforeEach(() => {
  users.length = 0;
  originalUsers.forEach((user) => users.push({ ...user }));
  process.env.JWT_SECRET = "test-jwt-secret";
});

afterEach(() => {
  users.length = 0;
  originalUsers.forEach((user) => users.push({ ...user }));
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

describe("userService", () => {
  it("registers a valid user with a normalized email and hashed password", async () => {
    const newUser = await userService.registerUser({
      name: "Test User",
      email: "TEST@Example.edu.za ",
      department: "IT",
      password: "Password123!",
      rePassword: "Password123!",
    });

    assert.equal(newUser.name, "Test User");
    assert.equal(newUser.email, "test@example.edu.za");
    assert.equal(newUser.department, "it");
    assert.equal(newUser.role, "user");
    assert.notEqual(newUser.password, "Password123!");
    assert.ok(newUser.user_id > 0);
  });

  it("rejects duplicate emails", async () => {
    await assert.rejects(
      userService.registerUser({
        name: "Duplicate User",
        email: "admin@example.edu.za",
        department: "IT",
        password: "Password123!",
        rePassword: "Password123!",
      }),
      /Registration failed/
    );
  });

  it("rejects invalid departments", async () => {
    await assert.rejects(
      userService.registerUser({
        name: "Bad Department",
        email: "baddept@example.edu.za",
        department: "marketing",
        password: "Password123!",
        rePassword: "Password123!",
      }),
      /Invalid department/
    );
  });

  it("logs in and issues a token with the user's canonical ID", async () => {
    const registered = await userService.registerUser({
      name: "Login User",
      email: "login.user@example.edu.za",
      department: "IT",
      password: "Secret123!",
      rePassword: "Secret123!",
    });

    const response = await userService.userLogin({
      email: "login.user@example.edu.za",
      password: "Secret123!",
    });

    assert.equal(response.user.email, registered.email);
    assert.equal(typeof response.token, "string");
    const claims = jwt.verify(response.token, process.env.JWT_SECRET);
    assert.equal(claims.user_id, registered.user_id);
    assert.equal(claims.role, "user");
  });

  it("rejects an incorrect password", async () => {
    await userService.registerUser({
      name: "Login User",
      email: "login.user@example.edu.za",
      department: "IT",
      password: "Secret123!",
      rePassword: "Secret123!",
    });

    await assert.rejects(
      userService.userLogin({
        email: "login.user@example.edu.za",
        password: "WrongPassword",
      }),
      /Invalid email or password/
    );
  });
});
