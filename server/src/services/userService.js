// services/userServices.js

import bcrypt from "bcrypt";
import * as userRepository from "../repositories/userRepository.js";
import { createValidationError, validateFieldInputs } from "../validation/validateFieldInputs.js";
import { getPasswordValidationError } from "../validation/password.js";
import { ALLOWED_DEPARTMENTS } from "../constants/departments.js";
import jwt from "jsonwebtoken";

const registrationFailureMessage = "Registration failed, please contact administrator";

export async function registerUser({
  name,
  email,
  department,
  password,
  rePassword,
} = {}) {
  validateFieldInputs({
    name,
    email,
    department,
    password,
    rePassword,
  });

  email = email.trim().toLowerCase();
  department = department.trim().toLowerCase();

  if (name.length > 100 || email.length > 320 || department.length > 50) {
    throw createValidationError("One or more fields exceed the maximum length");
  }

  if (!ALLOWED_DEPARTMENTS.includes(department)) {
    throw createValidationError("Invalid department");
  }

  if (password !== rePassword) {
    throw createValidationError("Passwords do not match");
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    throw createValidationError(passwordError);
  }

  const existingUser = await userRepository.getUserByEmail(email);
  if (existingUser) {
    throw createValidationError(registrationFailureMessage);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    return await userRepository.createUser({
      name: name.trim(),
      email,
      department,
      password: hashedPassword,
    });
  } catch (error) {
    if (error.code === "23505") {
      throw createValidationError(registrationFailureMessage);
    }
    throw error;
  }
}

export async function userLogin({ email, password } = {}) {
  validateFieldInputs({ email, password });
  email = email.trim().toLowerCase();
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw createValidationError("Invalid email or password", 401);
  }

  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    throw createValidationError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createValidationError("Invalid email or password", 401);
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("Server configuration error");
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role, department: user.department },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { user, token };
}

export async function listUsers() {
  return userRepository.getAllUsers();
}

export async function listAgents() {
  return userRepository.getAssignableAgents();
}

export async function changeUserRole(userId, role, requesterId) {
  const target = await userRepository.getUserById(userId);
  if (!target) {
    return undefined;
  }

  if (target.user_id === requesterId) {
    const error = new Error("You cannot change your own role");
    error.code = "SELF_ROLE_CHANGE";
    throw error;
  }

  return userRepository.updateUserRole(userId, role);
}