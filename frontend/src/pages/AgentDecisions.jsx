import React, { useState } from 'react';
import DecisionMatrix from '../components/DecisionMatrix';
import PolicyPanel from '../components/PolicyPanel';
import { BrainCircuit, Search, ChevronDown, Check } from 'lucide-react';
import { formatIndianCurrency } from '../services/formatters';

export default function AgentDecisionsPage({ payments, selectedPaymentId, onSelectPayment }) {
  // Use passed payment or fallback to first payment in list
  const activePayment = payments.find(p => p.payment_id === selectedPaymentId) || payments[0] || {
    payment_id: 'PAY_008809',
    customer_id: 'CUST_00441',
    amount: 739.29,
    failure_reason: 'UNKNOWN',
  };

  return (
    <div className="decisions-page">
      {/* Payment Selection Toolbar */}
      <section className="payment-picker-section">
        <div className="picker-label-group">
          <BrainCircuit size={18} className="green" />
          <div>
            <strong>Analyzing Payment Decision Engine</strong>
            <span>Select a failed payment to explore evaluated action + timing candidate economics</span>
          </div>
        </div>

        <div className="picker-dropdown-wrapper">
          <select
            value={activePayment.payment_id}
            onChange={(e) => {
              const p = payments.find(x => x.payment_id === e.target.value);
              if (p && onSelectPayment) onSelectPayment(p);
            }}
            className="payment-select-dropdown"
          >
            {payments.slice(0, 30).map(p => (
              <option key={p.payment_id} value={p.payment_id}>
                {p.payment_id} — {p.customer_id} ({formatIndianCurrency(p.amount, false)}) - {p.failure_reason}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Decision Matrix & Strategy Breakdown */}
      <section className="section-block">
        <DecisionMatrix payment={activePayment} />
      </section>

      {/* Safety Policy Panel */}
      <section className="section-block">
        <PolicyPanel policyBlocks={0} />
      </section>
    </div>
  );
}
