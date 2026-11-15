import * as ticketRepository from "../repositories/ticketRepository.js";
import * as userService from "../services/userService.js";
import {
  createValidationError,
  validateFieldInputs,
} from "../validation/validateFieldInputs.js";
import { isTicketCategoryId } from "../constants/ticketCategories.js";
import { canManageTickets } from "../utils/ticketAccess.js";

const maxPageSize = 100;
const defaultPageSize = 50;
const maxOffset = 1_000_000;

function parsePagination(query) {
  const parseInteger = (value, fallback, field, maximum) => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
      throw createValidationError(`${field} must be a non-negative integer`);
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed > maximum) {
      throw createValidationError(`${field} is out of range`);
    }
    return parsed;
  };

  const limit = parseInteger(query.limit, defaultPageSize, "limit", maxPageSize);
  if (limit === 0) {
    throw createValidationError("limit must be between 1 and 100");
  }

  return {
    limit,
    offset: parseInteger(query.offset, 0, "offset", maxOffset),
  };
}

export const createTicketHandler = async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { title, description, priority, categoryId } = body;

  validateFieldInputs({ title, description, priority });
  if (title.length > 200) {
    throw createValidationError("title must be 200 characters or fewer");
  }
  if (description.length > 5000) {
    throw createValidationError("description must be 5,000 characters or fewer");
  }

  if (
    !["number", "string"].includes(typeof categoryId)
    || !String(categoryId).trim()
    || !Number.isInteger(Number(categoryId))
    || !isTicketCategoryId(Number(categoryId))
  ) {
    throw createValidationError("Invalid categoryId");
  }

  const normalizedPriority = priority.trim().toLowerCase();
  if (!["low", "medium", "high", "urgent"].includes(normalizedPriority)) {
    throw createValidationError("Invalid priority");
  }

  const ticket = await ticketRepository.insertTicket({
    title: title.trim(),
    description: description.trim(),
    priority: normalizedPriority,
    categoryId: Number(categoryId),
    createdBy: req.user.user_id,
  });

  return res.status(201).json({ message: "Ticket created", ticket });
};

export const getTickets = async (req, res) => {
  const { limit, offset } = parsePagination(req.query);
  const { tickets, hasMore } = await ticketRepository.getAllTickets(req.user, { limit, offset });
  return res.status(200).json({
    success: true,
    data: tickets,
    pagination: { limit, offset, hasMore },
  });
};

export const getSingleTicket = async (req, res) => {
  const ticket = await ticketRepository.getTicketById(req.params.ticket_id, req.user);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Ticket not found",
    });
  }

  return res.status(200).json({ success: true, data: ticket });
};

export const updateTicketStatus = async (req, res) => {
  if (!canManageTickets(req.user)) {
    return res.status(403).json({
      success: false,
      message: "Only agents and admins can update ticket status",
    });
  }

  const status = req.body?.status;
  validateFieldInputs({ status });
  const normalizedStatus = status.trim().toLowerCase().replaceAll(" ", "_");
  if (!["open", "in_progress", "resolved", "closed"].includes(normalizedStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket status",
    });
  }

  const ticket = await ticketRepository.updateStatus(
    req.params.ticket_id,
    normalizedStatus,
    req.user.user_id
  );
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Ticket not found",
    });
  }

  return res.status(200).json({ success: true, data: ticket });
};

export const getTicketAssignees = async (req, res) => {
  if (!canManageTickets(req.user)) {
    return res.status(403).json({
      success: false,
      message: "Only agents and admins can view assignable agents",
    });
  }

  try {
    return res.status(200).json({
      success: true,
      data: await userService.listAgents(),
    });
  } catch (error) {
    console.error("Unable to list ticket assignees:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to list ticket assignees",
    });
  }
};

export const assignTicketToAgent = async (req, res) => {
  if (!canManageTickets(req.user)) {
    return res.status(403).json({
      success: false,
      message: "Only agents and admins can assign tickets",
    });
  }

  const assignedTo = req.body?.assignedTo;
  if (assignedTo !== null && (!Number.isSafeInteger(assignedTo) || assignedTo < 1)) {
    return res.status(400).json({
      success: false,
      message: "assignedTo must be an agent ID or null",
    });
  }

  try {
    if (assignedTo !== null) {
      const agents = await userService.listAgents();
      if (!agents.some((agent) => agent.user_id === assignedTo)) {
        return res.status(400).json({
          success: false,
          message: "Tickets can only be assigned to agents",
        });
      }
    }

    const ticket = await ticketRepository.assignTicket(req.params.ticket_id, assignedTo);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    if (error.code === "INVALID_ASSIGNEE") {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error("Unable to assign ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to assign ticket",
    });
  }
};