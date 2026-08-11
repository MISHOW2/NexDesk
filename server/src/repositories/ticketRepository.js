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
    id: tickets.length
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

export let getTicketById = async (id) => {
  return tickets.find(ticket => ticket.id === Number(id));
}; 

export let getUserById = async (id) =>{
  return users.find(user => user.id === Number(id));
}
export const updateStatus = async (id, status)=>{
  const ticket = getTicketById(id);

 const updatedTicket = {
  ...ticket,
  status
};

return updatedTicket;

}

export const assignedTicketTo = async (id ) =>{

} 