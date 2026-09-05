import React from 'react';

import {
  LayoutDashboard,
  RotateCw,
  BrainCircuit,
  ShieldCheck,
  X,
  Search,
  Sparkles,
  User,
  LogOut,
  ShoppingCart,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  onOpenSearch,
  onProfile,
  onLogout,
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'recovery',
      label: 'Recovery Operations',
      icon: RotateCw,
    },
    {
      id: 'decisions',
      label: 'Agent Decisions',
      icon: BrainCircuit,
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: ShieldCheck,
    },
    {
      id: 'checkout',
      label: 'Demo Checkout',
      icon: ShoppingCart,
    },
  ];

  const handleNavClick = (tabId) => {
    if (tabId === 'checkout') {
      window.location.href = '/checkout';
      return;
    }

    setActiveTab(tabId);

    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const handleProfileClick = () => {
    if (onProfile) {
      onProfile();
    } else {
      setActiveTab('profile');

      if (mobileOpen) {
        setMobileOpen(false);
      }
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? 'open' : ''
        }`}
      >

        {/* Brand */}
        <div className="brand">
          <div className="brand-mark">
            <Sparkles
              size={20}
              className="brand-sparkle"
            />
          </div>

          <div className="brand-info">
            <div className="brand-name">
              RECOUP
            </div>

            <div className="brand-subtitle">
              Adaptive AI Recovery
            </div>
          </div>

          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="search-launcher-container">
          <button
            type="button"
            className="search-launcher-btn"
            onClick={onOpenSearch}
          >
            <Search size={14} />

            <span>
              Search payments...
            </span>

            <kbd>
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Main navigation */}
        <nav
          className="navigation"
          aria-label="Main Navigation"
        >
          <div className="nav-group-label">
            OPERATIONS
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              activeTab === item.id;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() =>
                  handleNavClick(item.id)
                }
                className={`nav-item ${
                  isActive ? 'active' : ''
                }`}
                aria-current={
                  isActive
                    ? 'page'
                    : undefined
                }
              >
                <span className="nav-icon-wrapper">
                  <Icon
                    size={18}
                    className="nav-icon"
                  />
                </span>

                <span className="nav-label">
                  {item.label}
                </span>

                {isActive && (
                  <span className="active-indicator" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Account navigation */}
        <div className="sidebar-account">
          <div className="nav-group-label">
            ACCOUNT
          </div>

          {/* Profile */}
          <button
            type="button"
            className={`nav-item ${
              activeTab === 'profile'
                ? 'active'
                : ''
            }`}
            onClick={handleProfileClick}
          >
            <span className="nav-icon-wrapper">
              <User
                size={18}
                className="nav-icon"
              />
            </span>

            <span className="nav-label">
              Profile
            </span>

            {activeTab === 'profile' && (
              <span className="active-indicator" />
            )}
          </button>

          {/* Logout */}
          <button
            type="button"
            className="nav-item logout-nav-item"
            onClick={handleLogoutClick}
          >
            <span className="nav-icon-wrapper">
              <LogOut
                size={18}
                className="nav-icon"
              />
            </span>

            <span className="nav-label">
              Logout
            </span>
          </button>
        </div>

        {/* Sidebar bottom */}
        <div className="sidebar-bottom">

          <div className="agent-status-card">
            <div className="agent-status-header">
              <span className="status-dot pulsing" />

              <strong>
                Agent Active
              </strong>
            </div>

            <p className="agent-status-desc">
              Monitoring revenue risk
            </p>
          </div>

          <div className="version-tag">
            <span>
              Recoup v1.0
            </span>

            <span className="env-badge">
              Synthetic Eval
            </span>
          </div>

        </div>

      </aside>
    </>
  );
}