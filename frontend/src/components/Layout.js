import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/plans', icon: '📋', label: 'My Plans' },
  { to: '/learn', icon: '📚', label: 'Learn & Grow' },
  { to: '/chat', icon: '🤖', label: 'AI Chat' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="layout">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__logo">
          <span className="sidebar__logo-icon">🧘</span>
          <div className="sidebar__logo-text">
            <span className="sidebar__logo-main">StressLess</span>
            <span className="sidebar__logo-sub">Freshman</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar__nav-icon">{icon}</span>
              <span className="sidebar__nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{initials}</div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name}</span>
              <span className="sidebar__user-email">{user?.email}</span>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="layout__main">
        <header className="layout__header">
          <button
            className="layout__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
          <div className="layout__header-right">
            <span className="layout__greeting">
              Welcome back, <strong>{user?.name?.split(' ')[0]}</strong>
            </span>
          </div>
        </header>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
