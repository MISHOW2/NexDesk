import express from "express";
import { getUsers, updateUserRole } from "../controllers/adminControllers.js";
import { authenticate } from "../middlewares/authMiddleWare/authenticate.js";

const router = express.Router();

router.use(authenticate, (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  return next();
});

router.get("/users", getUsers);
router.patch("/users/:userId", updateUserRole);

export default router;
