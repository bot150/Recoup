import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  User, 
  BrainCircuit, 
  Clock,
  ArrowDown
} from 'lucide-react';
import { formatIndianCurrency, formatProbability, formatDateTime } from '../services/formatters';

export default function AuditDrawer({ auditEvent, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!auditEvent) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(auditEvent, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timelineSteps = [
    { label: 'Failure detected', time: auditEvent.timestamp, status: 'complete' },
    { label: 'ML prediction', detail: `Prob: ${formatProbability(auditEvent.selected_probability || auditEvent.smart_retry_probability)}`, status: 'complete' },
    { label: 'Action selected', detail: `${auditEvent.selected_action || 'SMART_RETRY'} (+${auditEvent.selected_timing_hours || 24}h)`, status: 'complete' },
    { label: 'Policy checked', detail: auditEvent.policy_reason || 'Action satisfies all policy rules.', status: auditEvent.policy_allowed ? 'complete' : 'blocked' },
    { label: 'Action executed', detail: `Attempt ${auditEvent.attempt_number || 1}`, status: 'complete' },
    { label: 'Outcome recorded', detail: `${auditEvent.outcome} (${formatIndianCurrency(auditEvent.recovered_amount || 0, false)})`, status: auditEvent.outcome === 'RECOVERED' ? 'success' : 'neutral' },
  ];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="detail-drawer audit-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-eyebrow">AUDIT RECORD & TIMELINE</span>
            <h2>{auditEvent.payment_id}</h2>
          </div>
          <button className="close-drawer-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Section 1: Decision Timeline */}
          <div className="drawer-section">
            <div className="section-title">
              <Clock size={15} />
              <span>Decision Timeline</span>
            </div>

            <div className="decision-timeline">
              {timelineSteps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className={`timeline-node ${step.status}`}>
                    <div className="node-icon-dot" />
                    <div className="node-content">
                      <strong className="node-label">{step.label}</strong>
                      {step.detail && <span className="node-detail">{step.detail}</span>}
                      {step.time && <span className="node-time">{formatDateTime(step.time)}</span>}
                    </div>
                  </div>

                  {idx < timelineSteps.length - 1 && (
                    <div className="timeline-connector-line">
                      <ArrowDown size={12} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Section 2: Exact Event Record Fields */}
          <div className="drawer-section">
            <div className="section-title">
              <ShieldCheck size={15} />
              <span>Recorded Event Log Fields</span>
            </div>

            <div className="audit-fields-grid">
              <div className="audit-field-card">
                <span className="af-label">Timestamp</span>
                <strong className="af-val">{auditEvent.timestamp}</strong>
              </div>

              <div className="audit-field-card">
                <span className="af-label">Customer ID</span>
                <strong className="af-val">{auditEvent.customer_id}</strong>
              </div>

              <div className="audit-field-card">
                <span className="af-label">Payment Amount</span>
                <strong className="af-val">{formatIndianCurrency(auditEvent.amount, false)}</strong>
              </div>

              <div className="audit-field-card">
                <span className="af-label">Failure Reason</span>
                <span className="failure-tag-pill">{auditEvent.failure_reason}</span>
              </div>

              <div className="audit-field-card">
                <span className="af-label">Selected Action</span>
                <strong className="af-val green">{auditEvent.selected_action}</strong>
              </div>

              <div className="audit-field-card">
                <span className="af-label">Selected Timing</span>
                <strong className="af-val">+{auditEvent.selected_timing_hours}h</strong>
              </div>

              <div className="audit-field-card">
                <span className="af-label">Selection Probability</span>
                <strong className="af-val green">{formatProbability(auditEvent.selected_probability)}</strong>
              </div>

              <div className="audit-field-card">
                <span className="af-label">Expected Recovery</span>
                <strong className="af-val green">{formatIndianCurrency(auditEvent.expected_recovery, false)}</strong>
              </div>

              <div className="audit-field-card full-width">
                <span className="af-label">Policy Allowed & Reason</span>
                <div className="policy-allowed-text">
                  <span className="policy-allowed">✓ Allowed</span>
                  <span>{auditEvent.policy_reason || 'Action satisfies all policy rules.'}</span>
                </div>
              </div>

              <div className="audit-field-card full-width">
                <span className="af-label">Outcome & Recovered Amount</span>
                <div className="outcome-result-row">
                  <span className={`outcome-pill ${auditEvent.outcome === 'RECOVERED' ? 'recovered' : 'not-recovered'}`}>
                    {auditEvent.outcome}
                  </span>
                  <strong>{formatIndianCurrency(auditEvent.recovered_amount, false)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Copy Button */}
        <div className="drawer-footer">
          <button className="action-btn copy-json-btn" onClick={handleCopyJson}>
            {copied ? <Check size={15} className="green" /> : <Copy size={15} />}
            <span>{copied ? 'Copied Event JSON!' : 'Copy Event JSON'}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
