import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
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

  try {
    const decoded = jwt.verify(bearerToken[1], process.env.JWT_SECRET);
    if (
      typeof decoded === "string" ||
      !Number.isInteger(decoded.user_id) ||
      typeof decoded.role !== "string"
    ) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
