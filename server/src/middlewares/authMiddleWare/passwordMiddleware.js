// middlewares/authMiddleware/passwordMiddleware.js

import { getPasswordValidationError } from "../../validation/password.js";

export function validatePassword(req, res, next) {
  const error = getPasswordValidationError(req.body?.password);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  return next();
}