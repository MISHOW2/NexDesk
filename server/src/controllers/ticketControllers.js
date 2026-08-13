import * as ticketRepository from "../repositories/ticketRepository.js";
import { validateFieldInputs } from "../validation/validateFieldInputs.js";

export const createTicketHandler = async (req, res) => {
  try {
    const { title, description, priority, categoryId } = req.body;

    validateFieldInputs({ title, description, priority, categoryId });

    const ticket = ticketRepository.insertTicket({
      title,
      description,
      priority,
      categoryId,
      createdBy: req.user.ticket_id
    });

    res.status(201).json({ message: "Ticket created", ticket });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    const allTickets = await ticketRepository.getAllTickets();

    if (allTickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tickets found",
      });
    }

    return res.status(200).json({
      success: true,
      data: allTickets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getSingleTicket = (req, res) => {
  const { ticket_id } = req.params;

  const ticket = ticketRepository.getTicketById(ticket_id)

  return res.status(200).json({
    success: true,
    data: ticket
  })
}

export const assignTo = (req, res) => {

}

export const updateTicketStatus = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { status } = req.body;

    const ticket = await ticketService.updatestatus(ticket_id, status);

    return res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


export async function assignTicket(req, res) {
  const {ticket_id} = req.params
  const {assignTo} = req.body
  //check if ticket exists 

  try {
    const existingTicket = await ticketRepository.getTicketById(ticket_id);
    if (!existingTicket) {
      throw new Error("Ticket not found");
    }
    // 2. Does this user exist?
    const agent = await userRepository.getUserById(assignedTo);
    if (!agent) {
      throw new Error("Assigned user not found");
    }

    // 3. Is this user actually allowed to have tickets assigned to them?
    if (agent.role !== "agent" && agent.role !== "admin") {
      throw new Error("Tickets can only be assigned to agents or admins");
    }

    // 4. All checks passed — now actually update it
    return await ticketRepository.assignedTicketTo(ticket_id, assignedTo);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}