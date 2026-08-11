import express from "express";
import { tickets } from "../data/tickets.js";
import { authenticate } from "../middlewares/authMiddleWare/authenticate.js";
import { validateFieldInputs } from "../validation/validateFieldInputs.js";
import { createTicketHandler, getSingleTicket, getTickets, updateTicketStatus } from "../controllers/ticketControllers.js";
const router = express.Router();


router.post('/:id', (req,res)=>{

})

router.post('/', authenticate,createTicketHandler );
router.get('/', authenticate,getTickets)
router.patch('/:id',authenticate, getSingleTicket )
router.patch('/:id',authenticate,updateTicketStatus)


export default router
