export function canManageTickets(user) {
  if (!user) return false;

  const role = String(user.role || '').toLowerCase();
  const department = String(user.department || '').trim().toLowerCase();

  return role === 'agent' || role === 'admin' || (role === 'user' && department === 'it');
}
