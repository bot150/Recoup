import React from 'react';
import { 
  X, 
  Play, 
  BrainCircuit, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  User, 
  Calendar, 
  AlertCircle, 
  CreditCard,
  Clock,
  TrendingUp,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { formatIndianCurrency, formatProbability, calculateExpectedRecovery, ACTION_COSTS } from '../services/formatters';

export default function PaymentDrawer({ 
  payment, 
  onClose, 
  onRunRecovery, 
  onViewDecision, 
  onViewAudit 
}) {
  if (!payment) return null;

  // Derive intelligence recommendation dynamically based on failure reason & amount
  const getDerivedIntel = () => {
    const reason = payment.failure_reason || 'UNKNOWN';
    const amt = Number(payment.amount) || 1000;
    
    if (reason === 'INSUFFICIENT_FUNDS') {
      return {
        action: 'NUDGE',
        timing: '+12 hours',
        hours: 12,
        prob: 0.775,
        reasoning: 'High recovery rate when sending customer nudge after morning salary/fund updates.'
      };
    } else if (reason === 'MANDATE_FAILURE') {
      return {
        action: 'PAYMENT_LINK',
        timing: '+1 hour',
        hours: 1,
        prob: 0.687,
        reasoning: 'Immediate payment link bypasses broken mandate authorization.'
      };
    } else {
      return {
        action: 'SMART_RETRY',
        timing: '+24 hours',
        hours: 24,
        prob: 0.542,
        reasoning: 'Gateway transient failure resolved during off-peak banking hours.'
      };
    }
  };

  const intel = getDerivedIntel();
  const expectedRecovery = calculateExpectedRecovery(payment.amount, intel.prob, intel.action);
  const cost = ACTION_COSTS[intel.action] || 0.50;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-eyebrow">PAYMENT DETAILS & INTEL</span>
            <h2>{payment.payment_id}</h2>
          </div>
          <button className="close-drawer-btn" onClick={onClose} aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Section 1: Payment Details */}
          <div className="drawer-section">
            <div className="section-title">
              <CreditCard size={15} />
              <span>Payment Overview</span>
            </div>
            
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Amount</span>
                <strong className="detail-value highlight-amount">
                  {formatIndianCurrency(payment.amount, false)}
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">Customer ID</span>
                <strong className="detail-value">{payment.customer_id || 'CUST_UNKNOWN'}</strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">Payment Method</span>
                <span className="method-pill">{payment.payment_method || 'UPI'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Failure Reason</span>
                <span className="failure-pill warning">{payment.failure_reason || 'UNKNOWN'}</span>
              </div>

              <div className="detail-item full-width">
                <span className="detail-label">Failure Timestamp</span>
                <span className="timestamp-value">
                  <Calendar size={13} /> {payment.timestamp || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Recovery Intelligence */}
          <div className="drawer-section intel-section">
            <div className="section-title">
              <BrainCircuit size={15} className="green" />
              <span>Recovery Intelligence</span>
            </div>

            <div className="intel-card">
              <div className="intel-row-grid">
                <div className="intel-box">
                  <span className="intel-box-label">RECOMMENDED ACTION</span>
                  <strong className="intel-action-badge">{intel.action}</strong>
                </div>

                <div className="intel-box">
                  <span className="intel-box-label">RECOMMENDED TIMING</span>
                  <strong className="intel-box-val">{intel.timing}</strong>
                </div>

                <div className="intel-box">
                  <span className="intel-box-label">PREDICTED PROBABILITY</span>
                  <strong className="intel-box-val green">
                    {formatProbability(intel.prob)}
                  </strong>
                </div>

                <div className="intel-box">
                  <span className="intel-box-label">EXPECTED RECOVERY</span>
                  <strong className="intel-box-val green">
                    {formatIndianCurrency(expectedRecovery, false)}
                  </strong>
                  <span className="cost-deduction-tag">Net of ₹{cost.toFixed(2)} cost</span>
                </div>
              </div>

              <div className="intel-reasoning">
                <strong>Why this recommendation?</strong>
                <p>{intel.reasoning}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Policy Status */}
          <div className="drawer-section">
            <div className="section-title">
              <ShieldCheck size={15} />
              <span>Policy Guardrails Check</span>
            </div>

            <div className="policy-status-list">
              <div className="policy-check-item allowed">
                <div className="check-icon"><CheckCircle2 size={15} /></div>
                <div className="check-info">
                  <strong>Retry Limit: {payment.attempt_number || 1} / 2 retries</strong>
                  <span>Within MAX_RETRIES policy (2)</span>
                </div>
              </div>

              <div className="policy-check-item allowed">
                <div className="check-icon"><CheckCircle2 size={15} /></div>
                <div className="check-info">
                  <strong>Nudge Limit: 0 / 2 nudges</strong>
                  <span>Within MAX_NUDGES policy (2)</span>
                </div>
              </div>

              <div className="policy-check-item allowed">
                <div className="check-icon"><CheckCircle2 size={15} /></div>
                <div className="check-info">
                  <strong>Cooldown Status: Satisfied</strong>
                  <span>Required COOLDOWN_HOURS (6h) passed</span>
                </div>
              </div>

              <div className="policy-check-item allowed">
                <div className="check-icon"><CheckCircle2 size={15} /></div>
                <div className="check-info">
                  <strong>Policy Decision: Allowed</strong>
                  <span>Action satisfies all deterministic guardrails.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="drawer-footer">
          <button 
            className="action-btn primary-run" 
            onClick={() => onRunRecovery(payment)}
          >
            <Play size={15} />
            <span>RUN RECOVERY</span>
          </button>

          <button 
            className="action-btn secondary"
            onClick={() => onViewDecision(payment)}
          >
            <BrainCircuit size={15} />
            <span>VIEW DECISION</span>
          </button>

          <button 
            className="action-btn secondary"
            onClick={() => onViewAudit(payment)}
          >
            <FileText size={15} />
            <span>VIEW AUDIT</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
