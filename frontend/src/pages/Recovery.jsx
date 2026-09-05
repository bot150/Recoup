import React from 'react';
import RecoveryTable from '../components/RecoveryTable';
import { RotateCw, ShieldCheck, Zap, HelpCircle } from 'lucide-react';

export default function RecoveryPage({ payments, onSelectPayment }) {
  const totalFailed = payments.length || 605;
  const highRiskCount = payments.filter(p => p.failure_reason === 'INSUFFICIENT_FUNDS').length;
  const mandateCount = payments.filter(p => p.failure_reason === 'MANDATE_FAILURE').length;

  return (
    <div className="recovery-page">
      {/* Overview summary strip for operations */}
      <section className="ops-summary-strip">
        <div className="ops-stat-pill">
          <div className="pill-icon red"><RotateCw size={15} /></div>
          <div className="pill-text">
            <strong>{totalFailed} Failed Payments</strong>
            <span>Active monitoring pool</span>
          </div>
        </div>

        <div className="ops-stat-pill">
          <div className="pill-icon amber"><Zap size={15} /></div>
          <div className="pill-text">
            <strong>{highRiskCount} Insufficient Funds</strong>
            <span>Optimal candidate for NUDGE (+12h)</span>
          </div>
        </div>

        <div className="ops-stat-pill">
          <div className="pill-icon blue"><ShieldCheck size={15} /></div>
          <div className="pill-text">
            <strong>{mandateCount} Mandate Failures</strong>
            <span>Optimal candidate for PAYMENT_LINK</span>
          </div>
        </div>
      </section>

      {/* Main Payment Operations Table */}
      <section className="section-block">
        <RecoveryTable payments={payments} onSelectPayment={onSelectPayment} />
      </section>
    </div>
  );
}
