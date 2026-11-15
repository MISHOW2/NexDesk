export function canManageTickets(user) {
  if (!user) return false;

  const role = String(user.role || '').toLowerCase();

  return role === 'agent' || role === 'admin';
}
