import {
  BarChart3,
  BookOpen,
  Headphones,
  LayoutDashboard,
  Plus,
  Settings,
  Ticket,
} from 'lucide-react';
import { canManageTickets } from '../utils/permissions.js';

export function getNavigation(role, department) {
  if (!canManageTickets({ role, department })) {
    return [
      ['Dashboard', LayoutDashboard, 'My dashboard'],
      ['All tickets', Ticket, 'My tickets'],
      ['New ticket', Plus],
      ['Knowledge base', BookOpen],
      ['Settings', Settings],
    ];
  }

  return [
    ['Dashboard', LayoutDashboard],
    ['All tickets', Ticket],
    ['Assigned to me', Headphones],
    ['New ticket', Plus],
    ['Reports', BarChart3],
    ['Knowledge base', BookOpen],
    ['Settings', Settings],
  ];
}
