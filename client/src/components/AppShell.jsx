import React, { useState } from 'react';
import { ArrowUpRight, Bell, Headphones, LogOut, Menu, Moon, Search, Sun } from 'lucide-react';
import { getNavigation } from '../config/navigation.js';
import { getInitials } from '../utils/ticket.js';

export default function AppShell({
  auth,
  page,
  ticketCount,
  notes,
  unreadCount,
  theme,
  onNavigate,
  onLogout,
  onOpenCommandPalette,
  onOpenTicket,
  onMarkNotificationsRead,
  onToggleTheme,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navigate = nextPage => {
    onNavigate(nextPage);
    setMobileOpen(false);
  };

  return (
    <div className="app">
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <span className="brand-icon"><Headphones size={21} /></span>
          <span>NexDesk<span className="brand-dot">.</span><small>SERVICE DESK</small></span>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {getNavigation(auth.role, auth.department).map(([name, Icon, label]) => (
            <button
              key={name}
              className={page === name || (page === 'Ticket detail' && name === 'All tickets') ? 'nav-active' : ''}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              {label || name}
              {name === 'All tickets' && <span className="nav-count">{ticketCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-box">
            <div className="help-icon"><Headphones size={21} /></div>
            <strong>Need a hand?</strong>
            <p>Our support team is here to help you.</p>
            <button onClick={() => navigate('New ticket')}>Get support <ArrowUpRight size={14} /></button>
          </div>
          <button className="profile" title="Open settings" onClick={() => navigate('Settings')}>
            <span className="avatar">{getInitials(auth.name)}</span>
            <span className="profile-text">
              <strong>{auth.name}</strong>
              <small>{auth.role} · {auth.department}</small>
            </span>
          </button>
          <button className="logout-btn" onClick={onLogout}><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      {mobileOpen && <div className="overlay" onClick={() => setMobileOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-btn hamburger" onClick={() => setMobileOpen(value => !value)}><Menu /></button>
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{page === 'Ticket detail' ? 'Ticket details' : page}</strong>
          </div>
          <div className="top-actions">
            <button className="top-search" onClick={onOpenCommandPalette}>
              <Search size={15} /> Search or jump to… <kbd>Ctrl K</kbd>
            </button>
            <span className="today">
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button className="theme-btn" title="Toggle theme" onClick={onToggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="notif-wrap">
              <button
                className="icon-btn"
                onClick={() => {
                  setNotificationsOpen(open => !open);
                  if (!notificationsOpen) onMarkNotificationsRead();
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && <i />}
              </button>
              {notificationsOpen && (
                <div className="notification">
                  <div className="n-head">
                    <strong>Notifications</strong>
                    <button onClick={() => { setNotificationsOpen(false); navigate('All tickets'); }}>
                      View tickets
                    </button>
                  </div>
                  {notes.length === 0 && <div className="empty">You’re all caught up.</div>}
                  {notes.map(note => {
                    const Icon = note.icon;
                    return (
                      <button
                        key={note.id}
                        className="n-item"
                        onClick={() => {
                          setNotificationsOpen(false);
                          onOpenTicket(note.ticket);
                        }}
                      >
                        <span className="n-ico"><Icon size={15} /></span>
                        <span>{note.text}<small>{note.sub}</small></span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <span className="avatar top-avatar">{getInitials(auth.name)}</span>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
