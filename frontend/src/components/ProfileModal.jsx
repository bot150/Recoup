import React from 'react';
import { X, User, Mail, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, currentUser, onLogout }) {
  if (!isOpen) return null;

  const displayName = currentUser?.displayName || 'Authenticated User';
  const email = currentUser?.email || 'user@recoup.ai';
  const initial = displayName ? displayName[0].toUpperCase() : 'U';

  return (
    <div className="modal-backdrop" onClick={onClose} aria-hidden="true">
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div className="profile-modal-title">
            <User size={18} />
            <span>User Profile</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close profile">
            <X size={18} />
          </button>
        </div>

        <div className="profile-modal-body">
          {/* Avatar and Main Info */}
          <div className="profile-user-card">
            <div className="profile-avatar-large">
              {initial}
            </div>
            <div className="profile-user-info">
              <h3 className="profile-user-name">{displayName}</h3>
              <p className="profile-user-email">
                <Mail size={13} />
                <span>{email}</span>
              </p>
            </div>
          </div>

          {/* Account Details */}
          <div className="profile-details-grid">
            <div className="profile-detail-item">
              <span className="detail-label">Account Status</span>
              <div className="status-badge active">
                <CheckCircle2 size={13} />
                <span>Active • Enterprise Plan</span>
              </div>
            </div>

            <div className="profile-detail-item">
              <span className="detail-label">Environment</span>
              <div className="status-badge env">
                <ShieldCheck size={13} />
                <span>Synthetic Evaluation</span>
              </div>
            </div>

            <div className="profile-detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value">Revenue Operations Administrator</span>
            </div>

            <div className="profile-detail-item">
              <span className="detail-label">Policy Guardrails</span>
              <span className="detail-value green">Enforced & Active</span>
            </div>
          </div>
        </div>

        <div className="profile-modal-footer">
          <button className="profile-logout-btn" onClick={() => { onClose(); onLogout(); }}>
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
          <button className="profile-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
