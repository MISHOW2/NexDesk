import express from "express";
import { authenticate } from "../middlewares/authMiddleWare/authenticate.js";
import { createTicketHandler, getSingleTicket, getTickets, updateTicketStatus } from "../controllers/ticketControllers.js";
const router = express.Router();

router.post("/", authenticate, createTicketHandler);
router.get("/", authenticate, getTickets);
router.get("/:ticket_id", authenticate, getSingleTicket);
router.patch("/:ticket_id", authenticate, updateTicketStatus);


export default router
