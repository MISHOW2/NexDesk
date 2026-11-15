import jwt from 'jsonwebtoken';
import * as userRepository from "../../repositories/userRepository.js";

export async function authenticate(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server configuration error" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const bearerToken = /^Bearer\s+(\S+)$/i.exec(authHeader);
  if (!bearerToken) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  let decoded;
  try {
    decoded = jwt.verify(bearerToken[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (
    typeof decoded === "string" ||
    !Number.isInteger(decoded.user_id) ||
    typeof decoded.role !== "string"
  ) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const user = await userRepository.getUserById(decoded.user_id);
  if (!user) {
    return res.status(401).json({ message: "User account no longer exists" });
  }

  req.user = {
    user_id: user.user_id,
    role: user.role,
    department: user.department,
  };
  return next();
}
