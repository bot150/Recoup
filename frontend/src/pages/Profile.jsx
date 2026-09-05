import React from 'react';
import { User, LogOut } from 'lucide-react';

export default function Profile({ user, onLogout }) {
  return (
    <div className="page-shell">
      <div className="profile-card">
        <div className="profile-icon">
          <User size={24} />
        </div>

        <span className="section-eyebrow">ACCOUNT</span>
        <h2>Profile</h2>
        <p>Manage your Recoup account.</p>

        <div className="profile-field">
          <span>Email</span>
          <strong>{user?.email || 'Unknown'}</strong>
        </div>

        <div className="profile-field">
          <span>Authentication</span>
          <strong>Supabase Auth</strong>
        </div>

        <button className="profile-logout" onClick={onLogout}>
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  );
}