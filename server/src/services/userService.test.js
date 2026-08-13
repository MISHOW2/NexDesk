import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as userService from "./userService.js";
import { users } from "../data/users.js";

const originalUsers = users.map((user) => ({ ...user }));

beforeEach(() => {
  users.length = 0;
  originalUsers.forEach((user) => users.push({ ...user }));
  process.env.JWT_SECRET = "test-jwt-secret";
});

afterEach(() => {
  users.length = 0;
  originalUsers.forEach((user) => users.push({ ...user }));
});

describe("userService", () => {
  it("registers a valid user", async () => {
    const newUser = await userService.registerUser({
      name: "Test User",
      email: "TEST@Example.edu.za ",
      department: "IT",
      password: "Password123!",
      rePassword: "Password123!",
    });

    expect(newUser).toMatchObject({
      name: "Test User",
      email: "test@example.edu.za",
      department: "it",
      role: "user",
    });
    expect(newUser.password).not.toBe("Password123!");
    expect(newUser.id).toBeGreaterThan(0);
  });

  it("throws when registering a user with an existing email", async () => {
    await expect(
      userService.registerUser({
        name: "Duplicate User",
        email: "admin@example.edu.za",
        department: "IT",
        password: "Password123!",
        rePassword: "Password123!",
      })
    ).rejects.toThrow("Registration failed, please contact administrator");
  });

  it("throws when registering with an invalid department", async () => {
    await expect(
      userService.registerUser({
        name: "Bad Department",
        email: "baddept@example.edu.za",
        department: "marketing",
        password: "Password123!",
        rePassword: "Password123!",
      })
    ).rejects.toThrow("Invalid department");
  });

  it("logs in an existing user with the correct password", async () => {
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

    expect(response.user.email).toBe(registered.email);
    expect(response.token).toBeTypeOf("string");
  });

  it("throws when login password is incorrect", async () => {
    await expect(
      userService.userLogin({
        email: "agent.smith@example.edu.za",
        password: "WrongPassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });
});
