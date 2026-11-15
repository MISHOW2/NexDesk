import express from "express";
import { authenticate } from "../middlewares/authMiddleWare/authenticate.js";
import {
  assignTicketToAgent,
  createTicketHandler,
  getSingleTicket,
  getTicketAssignees,
  getTickets,
  updateTicketStatus,
} from "../controllers/ticketControllers.js";
const router = express.Router();

router.post("/", authenticate, createTicketHandler);
router.get("/assignees", authenticate, getTicketAssignees);
router.get("/", authenticate, getTickets);
router.get("/:ticket_id", authenticate, getSingleTicket);
router.patch("/:ticket_id", authenticate, updateTicketStatus);
router.patch("/:ticket_id/assignee", authenticate, assignTicketToAgent);


export default router
