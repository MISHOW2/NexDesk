export const TICKET_CATEGORY_IDS = Object.freeze({
  Hardware: 1,
  Network: 2,
  Software: 3,
  "Access / Passwords": 4,
});

export function isTicketCategoryId(value) {
  return Object.values(TICKET_CATEGORY_IDS).includes(value);
}
