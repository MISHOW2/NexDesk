export function canManageTickets({ role } = {}) {
  const normalizedRole = String(role || "").toLowerCase();

  return normalizedRole === "agent"
    || normalizedRole === "admin";
}
