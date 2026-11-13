import * as ticketRepository from "../repositories/ticketRepository.js";
import { validateFieldInputs } from "../validation/validateFieldInputs.js";
import { isTicketCategoryId } from "../constants/ticketCategories.js";
import { canManageTickets } from "../utils/ticketAccess.js";

export const createTicketHandler = async (req, res) => {
  const { title, description, priority, categoryId } = req.body;

  try {
    validateFieldInputs({ title, description, priority, categoryId });
    const parsedCategoryId = Number(categoryId);
    if (!Number.isInteger(parsedCategoryId) || !isTicketCategoryId(parsedCategoryId)) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }
    const normalizedPriority = priority.trim().toLowerCase();
    if (!["low", "medium", "high", "urgent"].includes(normalizedPriority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const ticket = await ticketRepository.insertTicket({
      title,
      description,
      priority: priority.trim().toLowerCase(),
      categoryId: Number(categoryId),
      createdBy: req.user.user_id
    });

    res.status(201).json({ message: "Ticket created", ticket });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create ticket",
      error: error.message,
    });
  }
};

export const getTickets = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: await ticketRepository.getAllTickets(req.user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getSingleTicket = async (req, res) => {
  try {
    const ticket = await ticketRepository.getTicketById(req.params.ticket_id, req.user);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateTicketStatus = async (req, res) => {
  if (!canManageTickets(req.user)) {
    return res.status(403).json({
      success: false,
      message: "Only IT department users, agents, and admins can update ticket status",
    });
  }

  try {
    const { ticket_id: ticketId } = req.params;
    const { status } = req.body;

    validateFieldInputs({ status });
    const normalizedStatus = status.trim().toLowerCase().replaceAll(" ", "_");
    if (!["open", "in_progress", "resolved", "closed"].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status",
      });
    }

    const ticket = await ticketRepository.updateStatus(ticketId, normalizedStatus);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    return res.status(error.code ? 500 : 400).json({
      success: false,
      message: error.message
    });
  }
};