//routes/authRoutes.js

import express from 'express';
import { validateCompanyEmail } from '../middlewares/authMiddleWare/emailDomainMiddleware.js';
import { login, register } from '../controllers/authControllers.js';
import { validatePassword } from '../middlewares/authMiddleWare/passwordMiddleware.js';
import { registerLimiter } from '../middlewares/authMiddleWare/registerLimiter.js';
import { authenticate } from '../middlewares/authMiddleWare/authenticate.js';

const router = express.Router();

const registrationMiddleware = [
  registerLimiter,        // stop abuse before doing any real work
  validateCompanyEmail,   // reject obviously wrong domains early
  validatePassword,       // then check password strength
  register                // only reach business logic if all checks pass
];

router.post('/register', ...registrationMiddleware);
router.post('/signup', ...registrationMiddleware);
router.post('/login', login);
router.get('/me', authenticate, (req, res) => {
  res.json({ message: "You are authenticated", user: req.user });
});

export default router;