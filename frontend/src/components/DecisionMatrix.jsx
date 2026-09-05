import React, { useState, useMemo } from 'react';
import { Sparkles, Check, Info, DollarSign, Clock, HelpCircle } from 'lucide-react';
import { formatIndianCurrency, formatProbability, ACTION_COSTS, calculateExpectedRecovery } from '../services/formatters';

export default function DecisionMatrix({ payment, onSelectCandidate }) {
  const amount = Number(payment?.amount) || 5000;
  const failureReason = payment?.failure_reason || 'INSUFFICIENT_FUNDS';

  const actions = ['SMART_RETRY', 'PAYMENT_LINK', 'NUDGE'];
  const timings = [
    { label: '+1h', hours: 1 },
    { label: '+6h', hours: 6 },
    { label: '+12h', hours: 12 },
    { label: '+24h', hours: 24 },
    { label: '+48h', hours: 48 },
  ];

  // Base probabilities matrix generator based on failure reason
  const candidatesMatrix = useMemo(() => {
    // Generate realistic relative probabilities per failure reason
    const baseProbs = {
      INSUFFICIENT_FUNDS: {
        SMART_RETRY: [0.312, 0.420, 0.380, 0.350, 0.280],
        PAYMENT_LINK: [0.480, 0.510, 0.530, 0.550, 0.490],
        NUDGE: [0.570, 0.600, 0.630, 0.590, 0.510], // Nudge +12h wins
      },
      MANDATE_FAILURE: {
        SMART_RETRY: [0.210, 0.250, 0.280, 0.300, 0.240],
        PAYMENT_LINK: [0.687, 0.650, 0.620, 0.580, 0.500], // Payment Link +1h wins
        NUDGE: [0.450, 0.480, 0.520, 0.500, 0.440],
      },
      UNKNOWN: {
        SMART_RETRY: [0.340, 0.450, 0.480, 0.542, 0.378], // Smart Retry +24h wins
        PAYMENT_LINK: [0.420, 0.460, 0.490, 0.520, 0.410],
        NUDGE: [0.380, 0.410, 0.440, 0.470, 0.400],
      },
    };

    const scenario = baseProbs[failureReason] || baseProbs.UNKNOWN;
    const items = [];

    actions.forEach(action => {
      const probList = scenario[action] || [0.3, 0.4, 0.5, 0.45, 0.35];
      timings.forEach((t, idx) => {
        const prob = probList[idx];
        const cost = ACTION_COSTS[action];
        const expected = calculateExpectedRecovery(amount, prob, action);
        items.push({
          action,
          timingLabel: t.label,
          hours: t.hours,
          probability: prob,
          expectedRecovery: expected,
          cost: cost
        });
      });
    });

    return items;
  }, [amount, failureReason]);

  // Find natural highest candidate
  const optimalCandidate = useMemo(() => {
    return [...candidatesMatrix].sort((a, b) => b.expectedRecovery - a.expectedRecovery)[0];
  }, [candidatesMatrix]);

  const [selected, setSelected] = useState(optimalCandidate);

  const handleCellClick = (candidate) => {
    setSelected(candidate);
    if (onSelectCandidate) onSelectCandidate(candidate);
  };

  return (
    <div className="decision-matrix-wrapper">
      {/* Matrix Grid Card */}
      <div className="panel matrix-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">CANDIDATE EVALUATION MATRIX</span>
            <h2 className="panel-title">Action × Timing Optimization Grid</h2>
          </div>
          <span className="matrix-payment-tag">
            Payment: <strong>{payment?.payment_id || 'PAY_008809'}</strong> ({formatIndianCurrency(amount, false)})
          </span>
        </div>

        <p className="matrix-instruction">
          Recoup evaluates 15 candidate action/timing strategies. Visual intensity reflects recovery probability. Click any cell to test candidate economics.
        </p>

        {/* Matrix Grid */}
        <div className="matrix-scroll-wrapper">
        <div className="matrix-grid-table">
          <div className="matrix-header-row">
            <div className="matrix-corner-cell">Action / Cost</div>
            {timings.map(t => (
              <div key={t.label} className="matrix-th-cell">{t.label}</div>
            ))}
          </div>

          {actions.map(action => {
            const cost = ACTION_COSTS[action];
            return (
              <div key={action} className="matrix-data-row">
                <div className="matrix-action-label-cell">
                  <strong>{action}</strong>
                  <span className="cost-tag">₹{cost.toFixed(2)} cost</span>
                </div>

                {timings.map(t => {
                  const candidate = candidatesMatrix.find(
                    c => c.action === action && c.hours === t.hours
                  );
                  const isOptimal = candidate?.action === optimalCandidate.action && candidate?.hours === optimalCandidate.hours;
                  const isSelectedCell = candidate?.action === selected.action && candidate?.hours === selected.hours;
                  const intensity = candidate ? Math.min(0.85, Math.max(0.12, candidate.probability)) : 0.2;

                  return (
                    <div
                      key={t.label}
                      onClick={() => handleCellClick(candidate)}
                      className={`matrix-cell ${isSelectedCell ? 'selected' : ''} ${isOptimal ? 'optimal' : ''}`}
                      style={{
                        backgroundColor: isSelectedCell 
                          ? 'rgba(16, 185, 129, 0.18)' 
                          : `rgba(16, 185, 129, ${intensity * 0.25})`,
                      }}
                      title={`${candidate.action} ${candidate.timingLabel}: ${formatProbability(candidate.probability)} prob | ${formatIndianCurrency(candidate.expectedRecovery, false)} expected`}
                    >
                      <span className="cell-prob">{formatProbability(candidate.probability)}</span>
                      <span className="cell-expected">{formatIndianCurrency(candidate.expectedRecovery, true)}</span>

                      {isOptimal && (
                        <span className="optimal-badge-star" title="AI Selected Strategy">
                          <Sparkles size={10} />
                        </span>
                      )}

                      {isSelectedCell && (
                        <span className="cell-check">
                          <Check size={11} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Selected Strategy Breakdown */}
      <div className="panel selected-strategy-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">STRATEGY DECISION BREAKDOWN</span>
            <h2 className="panel-title">Selected Intervention Plan</h2>
          </div>
          {selected.action === optimalCandidate.action && selected.hours === optimalCandidate.hours && (
            <span className="optimal-pill-tag">
              <Sparkles size={12} /> AI Optimal Decision
            </span>
          )}
        </div>

        <div className="strategy-metrics-row">
          <div className="strategy-metric-box">
            <span className="sm-label">SELECTED ACTION</span>
            <strong className="sm-value action-highlight">{selected.action}</strong>
          </div>

          <div className="strategy-metric-box">
            <span className="sm-label">SELECTED TIMING</span>
            <strong className="sm-value">{selected.timingLabel} ({selected.hours} hours)</strong>
          </div>

          <div className="strategy-metric-box">
            <span className="sm-label">RECOVERY PROBABILITY</span>
            <strong className="sm-value green">{formatProbability(selected.probability)}</strong>
          </div>

          <div className="strategy-metric-box">
            <span className="sm-label">EXPECTED RECOVERY</span>
            <strong className="sm-value green">
              {formatIndianCurrency(selected.expectedRecovery, false)}
            </strong>
          </div>
        </div>

        {/* WHY THIS DECISION Deterministic Explanation */}
        <div className="decision-explanation-card">
          <div className="explanation-title">
            <Sparkles size={15} className="sparkle-icon" />
            <span>WHY THIS DECISION?</span>
          </div>
          <p className="explanation-text">
            Recoup selected <strong>{selected.action}</strong> at <strong>{selected.timingLabel}</strong> because this strategy produced the highest expected recovery (<strong>{formatIndianCurrency(selected.expectedRecovery, false)}</strong>) among the 15 evaluated action/timing candidates, after deducting the action execution cost (<strong>₹{selected.cost.toFixed(2)}</strong>).
          </p>
        </div>
      </div>
    </div>
  );
}
