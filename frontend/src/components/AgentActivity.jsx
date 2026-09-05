import React from 'react';
import { Cpu, ShieldCheck, Zap, Layers, Activity } from 'lucide-react';

export default function AgentActivity({ summary }) {
  const recoup = summary?.recoup || {};
  const total = summary?.evaluation_payments || 605;

  return (
    <div className="panel agent-activity-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">AGENT BEHAVIOR</span>
          <h2 className="panel-title">Adaptive Actions</h2>
        </div>
        <div className="agent-pulse-indicator">
          <span className="pulse-dot" />
          <span className="pulse-text">Active Engine</span>
        </div>
      </div>

      <div className="activity-stats-grid">
        <div className="activity-stat-card">
          <div className="stat-icon-wrapper blue">
            <Layers size={16} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{recoup.second_actions ?? 151}</span>
            <span className="stat-label">Second actions</span>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="stat-icon-wrapper green">
            <Zap size={16} />
          </div>
          <div className="stat-content">
            <span className="stat-number">
              {recoup.average_attempts ? recoup.average_attempts.toFixed(2) : '1.25'}
            </span>
            <span className="stat-label">Average attempts</span>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="stat-icon-wrapper slate">
            <ShieldCheck size={16} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{recoup.policy_blocks ?? 0}</span>
            <span className="stat-label">Policy blocks</span>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="stat-icon-wrapper amber">
            <Activity size={16} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{total}</span>
            <span className="stat-label">Payments evaluated</span>
          </div>
        </div>
      </div>

      <div className="agent-message-callout">
        <div className="ai-badge-avatar">
          <Cpu size={16} />
        </div>
        <div className="callout-text">
          <strong>Adaptive recovery enabled</strong>
          <p>
            Recoup adapts intervention and timing instead of blindly retrying failed payments.
          </p>
        </div>
      </div>
    </div>
  );
}
