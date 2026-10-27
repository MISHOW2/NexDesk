//src\middlewares\authMiddleWare\registerLimiter.js

import rateLimit from "express-rate-limit";

export const registerLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 5,
});