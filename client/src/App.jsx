import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  LogOut,
  Moon,
  Plus,
  Sun,
  Ticket,
  UserCheck,
} from 'lucide-react';
import AppShell from './components/AppShell.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import { getNavigation } from './config/navigation.js';
import { api } from './services/api.js';
import { exportTicketsCsv, getSlaInfo, isDone, timeAgo, categoryIcons } from './utils/ticket.js';
import { canManageTickets } from './utils/permissions.js';
import { readStoredValue } from './utils/storage.js';
import UserDashboard from './pages/UserDashboard.jsx';
import StaffDashboardPage from './pages/StaffDashboardPage.jsx';
import TicketListPage from './pages/TicketListPage.jsx';
import NewTicketPage from './pages/NewTicketPage.jsx';
import TicketDetailPage from './pages/TicketDetailPage.jsx';
import KnowledgeBasePage from './pages/KnowledgeBasePage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
  const [auth, setAuth] = useState(() => {
    const user = readStoredValue('nexdesk-auth', null);
    const token = readStoredValue('nexdesk-token', null);
    return user && token ? { ...user, token } : null;
  });
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [theme, setTheme] = useState(() => readStoredValue('nexdesk-theme', 'light'));
  const [page, setPage] = useState('Dashboard');
  const [ticketListView, setTicketListView] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [readAt, setReadAt] = useState(() => readStoredValue('nexdesk-read', 0));
  const [toast, setToast] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const notify = message => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };
  const isStaff = canManageTickets(auth);
  const selectedTicket = tickets.find(ticket => ticket.id === selectedTicketId);
  const visibleTickets = useMemo(
    () => tickets.filter(ticket => isStaff || ticket.createdBy === Number(auth?.user_id)),
    [tickets, isStaff, auth?.user_id]
  );

  useEffect(() => {
    const { token, ...user } = auth || {};
    localStorage.setItem('nexdesk-auth', JSON.stringify(auth ? user : null));
    localStorage.setItem('nexdesk-token', JSON.stringify(token || null));
  }, [auth]);

  useEffect(() => {
    localStorage.setItem('nexdesk-theme', JSON.stringify(theme));
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => localStorage.setItem('nexdesk-read', JSON.stringify(readAt)), [readAt]);

  useEffect(() => {
    const handleShortcut = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!auth) {
      setTickets([]);
      setTicketsLoading(false);
      return undefined;
    }

    let active = true;
    setTicketsLoading(true);
    api.getTickets(auth)
      .then(data => { if (active) setTickets(data); })
      .catch(error => { if (active) notify(error.message); })
      .finally(() => { if (active) setTicketsLoading(false); });

    return () => { active = false; };
  }, [auth?.token]);

  const navigate = useCallback((nextPage, nextTicketView = 'all') => {
    setPage(nextPage);
    setSelectedTicketId(null);
    setTicketListView(nextTicketView);
  }, []);

  const openTicket = ticket => {
    setSelectedTicketId(ticket.id);
    setPage('Ticket detail');
  };

  const addActivity = (ticket, text) => [
    ...ticket.activity,
    { text, by: auth.name, ts: Date.now() },
  ];

  const updateTicketStatus = async (ticketId, status, activityText) => {
    try {
      const updatedTicket = await api.updateTicketStatus(auth, ticketId, status);
      setTickets(current => current.map(ticket => ticket.id === ticketId
        ? {
          ...ticket,
          ...updatedTicket,
          tags: ticket.tags,
          attachments: ticket.attachments,
          comments: ticket.comments,
          activity: activityText ? addActivity(ticket, activityText) : ticket.activity,
        }
        : ticket));
      notify('Ticket updated successfully');
    } catch (error) {
      notify(error.message);
    }
  };

  const createTicket = async fields => {
    try {
      const ticket = await api.createTicket(auth, fields);
      setTickets(current => [ticket, ...current]);
      notify('Your ticket has been created');
      return ticket;
    } catch (error) {
      notify(error.message);
      return null;
    }
  };

  const authenticate = async (mode, fields) => {
    try {
      if (mode === 'register') {
        await api.register({
          name: fields.name,
          email: fields.email,
          department: fields.department.toLowerCase(),
          password: fields.password,
          rePassword: fields.rePassword,
        });
      }

      const user = await api.login({ email: fields.email, password: fields.password });
      setAuth(user);
      navigate('Dashboard');
    } catch (error) {
      notify(error.message);
    }
  };

  const signOut = () => {
    setAuth(null);
    navigate('Dashboard');
  };

  const notes = useMemo(() => {
    if (!auth) return [];
    const notifications = [];

    visibleTickets.forEach(ticket => {
      ticket.activity.slice(-3).forEach(activity => {
        if (activity.by !== auth.name) {
          notifications.push({
            id: `${ticket.id}-${activity.ts}`,
            ticket,
            icon: activity.text.startsWith('Status') ? CheckCircle2 : activity.text.includes('Assigned') ? UserCheck : Ticket,
            text: `#${ticket.id} · ${activity.text}`,
            sub: `${activity.by} · ${timeAgo(activity.ts)}`,
            ts: activity.ts,
          });
        }
      });

      if (isStaff && getSlaInfo(ticket).breached) {
        notifications.push({
          id: `${ticket.id}-sla`,
          ticket,
          icon: Ticket,
          text: `#${ticket.id} has breached its SLA`,
          sub: ticket.title,
          ts: Date.now() - 1,
        });
      }
    });

    return notifications.sort((left, right) => right.ts - left.ts).slice(0, 8);
  }, [auth, isStaff, visibleTickets]);
  const unreadCount = notes.filter(note => note.ts > readAt).length;

  const commandItems = useMemo(() => {
    if (!auth) return [];

    const navigationItems = getNavigation(auth.role, auth.department).map(([name, Icon, label]) => ({
      id: `page-${name}`,
      group: 'Go to',
      icon: Icon,
      label: label || name,
      hint: 'Page',
      run: () => navigate(name),
    }));
    const actions = [
      { id: 'create-ticket', group: 'Actions', icon: Plus, label: 'Create new ticket', hint: 'N', run: () => navigate('New ticket') },
      { id: 'switch-theme', group: 'Actions', icon: theme === 'dark' ? Sun : Moon, label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`, hint: 'Theme', run: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
      { id: 'export-tickets', group: 'Actions', icon: Download, label: 'Export tickets to CSV', hint: 'CSV', run: () => exportTicketsCsv(visibleTickets) },
      { id: 'sign-out', group: 'Actions', icon: LogOut, label: 'Sign out', hint: '', run: signOut },
    ];
    const ticketItems = visibleTickets.map(ticket => ({
      id: `ticket-${ticket.id}`,
      group: 'Tickets',
      icon: categoryIcons[ticket.category] || Ticket,
      label: ticket.title,
      hint: `#${ticket.id}`,
      run: () => openTicket(ticket),
    }));

    return [...actions, ...navigationItems, ...ticketItems];
  }, [auth, theme, visibleTickets, navigate]);

  if (!auth) return <AuthScreen onAuthenticate={authenticate} toast={toast} />;

  const pageContent = (() => {
    if (page === 'Dashboard') {
      return isStaff
        ? (
          <StaffDashboardPage
            auth={auth}
            tickets={visibleTickets}
            go={navigate}
            openTicket={openTicket}
            onReviewQueue={view => navigate('All tickets', view)}
          />
        )
        : <UserDashboard auth={auth} tickets={visibleTickets} go={navigate} openTicket={openTicket} />;
    }
    if (page === 'All tickets' || page === 'Assigned to me') {
      return (
        <TicketListPage
          tickets={visibleTickets}
          auth={auth}
          staff={isStaff}
          page={page}
          initialView={ticketListView}
          loading={ticketsLoading}
          go={navigate}
          onOpenTicket={openTicket}
          onUpdateStatus={updateTicketStatus}
        />
      );
    }
    if (page === 'New ticket') return <NewTicketPage go={navigate} onCreateTicket={createTicket} onTicketCreated={openTicket} />;
    if (page === 'Ticket detail' && selectedTicket) {
      return <TicketDetailPage ticket={selectedTicket} staff={isStaff} go={navigate} onUpdateStatus={updateTicketStatus} />;
    }
    if (page === 'Knowledge base') return <KnowledgeBasePage go={navigate} />;
    if (page === 'Reports') return <ReportsPage tickets={visibleTickets} users={[auth]} />;
    if (page === 'Settings') {
      return (
        <SettingsPage
          auth={auth}
          onSave={profile => {
            setAuth(current => ({ ...current, ...profile }));
            notify('Profile updated in this browser; server sync is not available yet');
          }}
        />
      );
    }
    return null;
  })();

  return (
    <>
      <AppShell
        auth={auth}
        page={page}
        ticketCount={visibleTickets.length}
        notes={notes}
        unreadCount={unreadCount}
        theme={theme}
        onNavigate={navigate}
        onLogout={signOut}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenTicket={openTicket}
        onMarkNotificationsRead={() => setReadAt(Date.now())}
        onToggleTheme={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
      >
        {pageContent}
        <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} items={commandItems} />
        {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
      </AppShell>
    </>
  );
}
