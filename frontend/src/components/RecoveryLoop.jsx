import React, { useState } from 'react';
import { 
  LineChart, 
  Sliders, 
  ShieldCheck, 
  Send, 
  RotateCcw, 
  ArrowRight, 
  X, 
  Sparkles 
} from 'lucide-react';

export default function RecoveryLoop() {
  const [selectedStep, setSelectedStep] = useState(null);

  const steps = [
    {
      number: '01',
      title: 'Predict',
      shortDesc: 'ML estimates recovery probability',
      icon: LineChart,
      details: {
        heading: 'Machine Learning Probability Engine',
        description:
          'XGBoost/ML scoring evaluates payment failure features (bank response code, payment method, customer history, time-of-day) to estimate recovery probabilities across candidate intervention types.',
        metrics: ['Features Analyzed: 14+', 'Probability Range: 0.0% – 100.0%', 'Model: Gradient Boosted Trees'],
      },
    },
    {
      number: '02',
      title: 'Optimize',
      shortDesc: 'Compare action + timing combinations',
      icon: Sliders,
      details: {
        heading: 'Expected Monetary Value Optimization',
        description:
          'Evaluates candidate matrix (SMART_RETRY, PAYMENT_LINK, NUDGE) across time horizons (+1h, +6h, +12h, +24h, +48h). Calculates Expected Recovery = (Amount × Probability) - Action Cost to pick the highest net value.',
        metrics: [
          'SMART_RETRY Cost: ₹0.50',
          'PAYMENT_LINK Cost: ₹1.00',
          'NUDGE Cost: ₹0.20',
          'Selection Criteria: Maximize Net Expected Value',
        ],
      },
    },
    {
      number: '03',
      title: 'Protect',
      shortDesc: 'Policy engine enforces guardrails',
      icon: ShieldCheck,
      details: {
        heading: 'Deterministic Safety Guardrails',
        description:
          'Before executing any action, Recoup passes candidate decisions through strict deterministic safety rules. The AI model CANNOT override these policy constraints.',
        metrics: [
          'MAX_RETRIES: 2',
          'MAX_NUDGES: 2',
          'COOLDOWN_HOURS: 6h',
          'MAX_RECOVERY_DAYS: 7 days',
        ],
      },
    },
    {
      number: '04',
      title: 'Execute',
      shortDesc: 'Recovery action is performed',
      icon: Send,
      details: {
        heading: 'Automated Recovery Dispatch',
        description:
          'Dispatches the selected action precisely at the optimal timestamp via Razorpay/Gateway integrations (Smart Auto-retry, WhatsApp/SMS Nudge, or Payment Link generation).',
        metrics: [
          'Dispatch Latency: < 50ms',
          'Supported Actions: Smart Retry, Payment Link, Nudge, Stop',
        ],
      },
    },
    {
      number: '05',
      title: 'Learn',
      shortDesc: 'Outcome informs the next decision',
      icon: RotateCcw,
      details: {
        heading: 'Feedback & Multi-Step Strategy',
        description:
          'Observes payment outcome. If initial recovery fails and policies permit, Recoup re-evaluates probability for a second bounded action (e.g. Nudge or Payment Link) or halts to avoid customer friction.',
        metrics: [
          'Second Action Rate: 24.9% (151 payments)',
          'Policy Blocks: 0',
          'Audit Trace: 100% Immutable Logged',
        ],
      },
    },
  ];

  return (
    <div className="panel recovery-loop-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">CORE RECOUP ARCHITECTURE</span>
          <h2 className="panel-title">Adaptive Recovery Loop</h2>
        </div>
        <span className="loop-instruction">Click any step to inspect technical details</span>
      </div>

      <div className="loop-flow-container">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = selectedStep?.number === step.number;
          return (
            <React.Fragment key={step.number}>
              <div
                className={`loop-step-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedStep(step)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedStep(step)}
              >
                <div className="step-card-top">
                  <span className="step-number">{step.number}</span>
                  <div className="step-icon-bubble">
                    <Icon size={16} />
                  </div>
                </div>
                <strong className="step-title">{step.title}</strong>
                <span className="step-short-desc">{step.shortDesc}</span>
              </div>

              {idx < steps.length - 1 && (
                <div className="loop-arrow-connector">
                  <ArrowRight size={14} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Detail Modal / Panel when step is selected */}
      {selectedStep && (
        <div className="step-detail-overlay" onClick={() => setSelectedStep(null)}>
          <div className="step-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div className="detail-title-group">
                <span className="detail-badge">Stage {selectedStep.number}</span>
                <h3>{selectedStep.details.heading}</h3>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setSelectedStep(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <p className="detail-description">{selectedStep.details.description}</p>

            <div className="detail-metrics-list">
              <span className="metrics-header">KEY PARAMETERS & LIMITS</span>
              <ul>
                {selectedStep.details.metrics.map((m, i) => (
                  <li key={i}>
                    <Sparkles size={12} className="bullet-sparkle" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
