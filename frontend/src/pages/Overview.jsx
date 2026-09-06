import React from 'react';
import MetricCard from '../components/MetricCard';
import PerformancePanel from '../components/PerformancePanel';
import AgentActivity from '../components/AgentActivity';
import RecoveryLoop from '../components/RecoveryLoop';
import AuditTable from '../components/AuditTable';
import { formatIndianCurrency } from '../services/formatters';

export default function Overview({
  summary,
  audit,
  onSelectPayment,
  onSelectAudit,
}) {

  // ============================================================
  // NORMALIZE BACKEND SUMMARY DATA
  // ============================================================

  const backendBaseline = summary?.baseline || {};

  const baseline = {
    recovered_payments:
      Number(
        backendBaseline.recovered_payments ?? 235
      ),

    recovery_rate:
      Number(
        backendBaseline.recovery_rate ?? 38.84
      ),

    total_recovered:
      Number(
        backendBaseline.total_recovered ??
        backendBaseline.recovered_amount ??
        597783.55
      ),

    average_attempts:
      Number(
        backendBaseline.average_attempts ?? 1.69
      ),
  };


  // Backend calls this "agentic"
  const backendRecoup =
    summary?.recoup ||
    summary?.agentic ||
    {};

  const recoup = {
    recovered_payments:
      Number(
        backendRecoup.recovered_payments ?? 515
      ),

    recovery_rate:
      Number(
        backendRecoup.recovery_rate ?? 85.12
      ),

    total_recovered:
      Number(
        backendRecoup.total_recovered ??
        backendRecoup.recovered_amount ??
        1387407.84
      ),

    average_attempts:
      Number(
        backendRecoup.average_attempts ?? 1.25
      ),
  };


  // ============================================================
  // IMPROVEMENT DATA
  // ============================================================

  const backendImprovement =
    summary?.improvement || {};

  const improvement = {

    additional_recovered:
      Number(
        backendImprovement.additional_recovered ??
        backendImprovement.additional_revenue ??
        789624.29
      ),

    recovery_rate_uplift:
      Number(
        backendImprovement.recovery_rate_uplift ??
        46.28
      ),

    relative_money_uplift:
      Number(
        backendImprovement.relative_money_uplift ??
        backendImprovement.relative_improvement ??
        132.09
      ),
  };


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="overview-page">

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <section className="metrics-grid">

        <MetricCard
          label="Revenue Recovered"
          value={formatIndianCurrency(
            recoup.total_recovered,
            true
          )}
          detail={`vs ${formatIndianCurrency(
            baseline.total_recovered,
            true
          )} baseline`}
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
          value={formatIndianCurrency(
            improvement.additional_recovered,
            true
          )}
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


      {/* ======================================================
          PERFORMANCE + AGENT ACTIVITY
      ====================================================== */}

      <section className="two-column-grid">

        <PerformancePanel
          summary={summary}
        />

        <AgentActivity
          summary={summary}
        />

      </section>


      {/* ======================================================
          RECOVERY LOOP
      ====================================================== */}

      <section className="section-block">

        <RecoveryLoop />

      </section>


      {/* ======================================================
          RECENT AUDIT
      ====================================================== */}

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