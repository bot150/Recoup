import React from 'react';
import MetricCard from '../components/MetricCard';
import PerformancePanel from '../components/PerformancePanel';
import AgentActivity from '../components/AgentActivity';
import RecoveryLoop from '../components/RecoveryLoop';
import AuditTable from '../components/AuditTable';
import { formatIndianCurrency } from '../services/formatters';

export default function Overview({ summary, audit, onSelectPayment, onSelectAudit }) {
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

  return (
    <div className="overview-page">
      {/* KPI Cards Grid */}
      <section className="metrics-grid">
        <MetricCard
          label="Revenue Recovered"
          value={formatIndianCurrency(recoup.total_recovered, true)}
          detail={`vs ${formatIndianCurrency(baseline.total_recovered, true)} baseline`}
          positive={true}
          iconType="revenue"
        />

        <MetricCard
          label="Recovery Rate"
          value={`${recoup.recovery_rate.toFixed(2)}%`}
          detail={`+${improvement.recovery_rate_uplift.toFixed(2)} pp uplift`}
          positive={true}
          iconType="rate"
        />

        <MetricCard
          label="Incremental Revenue"
          value={formatIndianCurrency(improvement.additional_recovered, true)}
          detail={`+${improvement.relative_money_uplift.toFixed(1)}% more money`}
          positive={true}
          iconType="incremental"
        />

        <MetricCard
          label="Average Attempts"
          value={recoup.average_attempts.toFixed(2)}
          detail={`vs ${baseline.average_attempts.toFixed(2)} baseline`}
          positive={true}
          iconType="attempts"
        />
      </section>

      {/* Performance Benchmark + Agent Activity */}
      <section className="two-column-grid">
        <PerformancePanel summary={summary} />
        <AgentActivity summary={summary} />
      </section>

      {/* Interactive Core Recovery Loop */}
      <section className="section-block">
        <RecoveryLoop />
      </section>

      {/* Recent Traceability Preview */}
{/* Recent Traceability Preview */}
<section className="section-block">
  <AuditTable
    audit={(audit || []).slice(0, 5)}
    isRecentPreview={true}
    onSelectAudit={onSelectAudit}
  />
</section>
    </div>
  );
}
