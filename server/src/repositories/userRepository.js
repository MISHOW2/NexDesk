//repositories/userRepositories
import { users } from "../data/users.js";

export function getUserByEmail(email) {
  return users.find(user => user.email === email);
}

export function getUserById(userId) {
  return users.find(user => user.user_id === Number(userId));
}

export function createUser({ name, email, department, password }) {
  const newUser = {
    user_id: users.length
      ? Math.max(...users.map(user => user.user_id)) + 1
      : 1,
    name,
    email,
    department,
    password,
    role: "user",
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  return newUser;
}
