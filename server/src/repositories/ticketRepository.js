import { tickets } from "../data/tickets.js";
import { users } from "../data/users.js";

export const insertTicket = ({
  title,
  description,
  priority,
  categoryId,
  createdBy,
}) => {
  const newTicket = {
    ticket_id: tickets.length
      ? Math.max(...tickets.map(ticket => ticket.id)) + 1
      : 101,
    title,
    description,
    status: "open",
    priority,
    categoryId,
    createdBy,
    assignedTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
  };

  tickets.push(newTicket);

  return newTicket;
};

  
export const getAllTickets = async () => {

return tickets;

};

export let getTicketById = async (ticket_id) => {
  return tickets.find(ticket => ticket.ticket_id === Number(ticket_id));
}; 

export let getUserById = async (user_id) =>{
  return users.find(user => user.user_id === Number(user_id));
}
export const updateStatus = async (ticket_id, status)=>{
  const ticket = getTicketById(ticket_id);

 const updatedTicket = {
  ...ticket,
  status
};

return updatedTicket;

}

export const assignedTicketTo = async (id ) =>{

} 