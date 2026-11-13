export function canManageTickets({ role, department } = {}) {
  const normalizedRole = String(role || "").toLowerCase();
  const normalizedDepartment = String(department || "").trim().toLowerCase();

  return normalizedRole === "agent"
    || normalizedRole === "admin"
    || (normalizedRole === "user" && normalizedDepartment === "it");
}
