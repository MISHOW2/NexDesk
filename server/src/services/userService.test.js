import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import * as userService from "./userService.js";
import { users } from "../data/users.js";

const originalUsers = users.map((user) => ({ ...user }));
const originalJwtSecret = process.env.JWT_SECRET;

describe("userService", () => {
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

  it("registers a valid user", async () => {
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

  it("throws when registering a user with an existing email", async () => {
    await assert.rejects(
      userService.registerUser({
        name: "Duplicate User",
        email: "admin@example.edu.za",
        department: "IT",
        password: "Password123!",
        rePassword: "Password123!",
      }),
      { message: "Registration failed, please contact administrator" }
    );
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

  it("logs in an existing user with the correct password", async () => {
    const registered = await userService.registerUser({
      name: "Login User",
      email: "login.user@example.edu.za",
      department: "IT",
      password: "Secret123!",
      rePassword: "Secret123!",
    });

    const { user, token } = await userService.userLogin({
      email: "login.user@example.edu.za",
      password: "Secret123!",
    });

    assert.equal(user.email, registered.email);
    assert.equal(typeof token, "string");
  });

  it("throws when login password is incorrect", async () => {
    await assert.rejects(
      userService.userLogin({
        email: "agent.smith@example.edu.za",
        password: "WrongPassword",
      }),
      { message: "Invalid email or password" }
    );
  });
});
