//middlewares/emailDomainMiddleware

import validator from "validator";

export function validateCompanyEmail(req, res, next) {
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (!allowedDomain?.trim()) {
    return res.status(500).json({ message: "Server configuration error" });
  }

  const email = req.body?.email;
  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!validator.isEmail(normalizedEmail)) {
    return res.status(400).json({ message: "Email is invalid" });
  }

  const domain = normalizedEmail.split("@")[1];
  if (domain !== allowedDomain.trim().toLowerCase().replace(/^@/, "")) {
    return res.status(400).json({
      message: "Only Company email addresses are allowed",
    });
  }

  next();
}

