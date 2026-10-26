// middlewares/authMiddleware/passwordMiddleware.js

import validator from "validator";

export function validatePassword(req, res, next) {
  const password = req.body?.password;

  if (typeof password !== "string" || !password.trim()) {
    return res.status(400).json({
      message: "Password is required",
    });
  }

  if (
    !validator.isStrongPassword(password, {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters long and contain an uppercase letter, lowercase letter, number, and special character",
    });
  }

  next();
}