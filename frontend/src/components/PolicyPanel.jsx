import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function PolicyPanel({ policyBlocks = 0 }) {
  const guardrails = [
    { label: 'Maximum retries', value: '2 retries per payment', detail: 'MAX_RETRIES = 2' },
    { label: 'Maximum nudges', value: '2 nudges per payment', detail: 'MAX_NUDGES = 2' },
    { label: 'Cooldown period', value: '6 hours between actions', detail: 'COOLDOWN_HOURS = 6' },
    { label: 'Recovery window', value: '7 days maximum window', detail: 'MAX_RECOVERY_DAYS = 7' },
  ];

  return (
    <div className="panel policy-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">SAFETY POLICY ENGINE</span>
          <h2 className="panel-title">Policy Guardrails</h2>
        </div>
        <div className="policy-block-badge">
          <ShieldCheck size={14} />
          <span>Policy blocks: {policyBlocks}</span>
        </div>
      </div>

      <div className="policy-guardrails-list">
        {guardrails.map((rule, idx) => (
          <div key={idx} className="guardrail-item">
            <div className="rule-icon-check">
              <CheckCircle2 size={16} />
            </div>
            <div className="rule-text-content">
              <strong>{rule.label}: {rule.value.split(' ')[0]} {rule.value.split(' ')[1]}</strong>
              <span>{rule.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="policy-explanation-box">
        <Lock size={15} className="lock-icon" />
        <p>
          <strong>Deterministic Safety Rules:</strong> Policy rules are strict hard limits enforced prior to execution. The ML model cannot override or bypass these safety guardrails.
        </p>
      </div>
    </div>
  );
}
