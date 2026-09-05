import React, { useState } from 'react';
import { Info, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { formatIndianCurrency } from '../services/formatters';

export default function PerformancePanel({ summary }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const baseline = summary?.baseline || {
    recovered_payments: 235,
    recovery_rate: 38.84,
    total_recovered: 597783.55,
    average_attempts: 1.69,
  };

  const recoup = summary?.recoup || {
    recovered_payments: 515,
    recovery_rate: 85.12,
    total_recovered: 1387407.84,
    average_attempts: 1.25,
  };

  const improvement = summary?.improvement || {
    additional_recovered: 789624.29,
    recovery_rate_uplift: 46.28,
    relative_money_uplift: 132.09,
  };

  const totalPayments = summary?.evaluation_payments || 605;

  return (
    <div className="panel performance-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">BENCHMARK EVALUATION</span>
          <h2 className="panel-title">Recovery Performance</h2>
        </div>

        <div className="held-out-container">
          <span className="held-out-badge">
            {totalPayments} held-out payments
          </span>
          <button
            className="info-tooltip-btn"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
            aria-label="Benchmark details"
          >
            <Info size={14} />
          </button>

          {showTooltip && (
            <div className="tooltip-popover">
              <p>
                Evaluation performed on payments not used to generate the training scenarios.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="performance-content">
        {/* Baseline Bar */}
        <div className="benchmark-row">
          <div className="benchmark-meta">
            <div className="benchmark-name">
              <span className="legend-indicator baseline" />
              <strong>Fixed Retry Baseline</strong>
              <span className="method-sub">Fixed +24h schedule</span>
            </div>
            <div className="benchmark-stat">
              <span className="rate-num">{baseline.recovery_rate.toFixed(2)}%</span>
              <span className="sub-stat">
                {baseline.recovered_payments} recovered ({formatIndianCurrency(baseline.total_recovered)})
              </span>
            </div>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill baseline"
              style={{ width: `${baseline.recovery_rate}%` }}
            >
              <span className="bar-label">{baseline.recovery_rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Recoup Bar */}
        <div className="benchmark-row highlight-recoup">
          <div className="benchmark-meta">
            <div className="benchmark-name">
              <span className="legend-indicator recoup" />
              <strong>Agentic Recoup</strong>
              <span className="recoup-tag">
                <Sparkles size={11} /> Adaptive Timing & Actions
              </span>
            </div>
            <div className="benchmark-stat">
              <span className="rate-num green-highlight">
                {recoup.recovery_rate.toFixed(2)}%
              </span>
              <span className="sub-stat green">
                {recoup.recovered_payments} recovered ({formatIndianCurrency(recoup.total_recovered)})
              </span>
            </div>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill recoup"
              style={{ width: `${recoup.recovery_rate}%` }}
            >
              <span className="bar-label">{recoup.recovery_rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Delta Callout Grid */}
        <div className="performance-delta-grid">
          <div className="delta-card">
            <span className="delta-label">Additional Recovered</span>
            <span className="delta-value">
              +{formatIndianCurrency(improvement.additional_recovered)}
            </span>
            <span className="delta-sub">
              +{improvement.relative_money_uplift.toFixed(1)}% monetary uplift
            </span>
          </div>

          <div className="delta-card">
            <span className="delta-label">Recovery Rate Uplift</span>
            <span className="delta-value">
              +{improvement.recovery_rate_uplift.toFixed(2)} pp
            </span>
            <span className="delta-sub">
              235 → 515 payments recovered
            </span>
          </div>

          <div className="delta-card">
            <span className="delta-label">Efficiency Impact</span>
            <span className="delta-value">
              {recoup.average_attempts.toFixed(2)} attempts
            </span>
            <span className="delta-sub">
              vs {baseline.average_attempts.toFixed(2)} baseline attempts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
