import React from 'react';

import AuditTable from '../components/AuditTable';

import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function AuditTrailPage({
  audit = [],
  onSelectAudit,
}) {

  // Always work with an array.
  const auditRecords = Array.isArray(audit)
    ? audit
    : [];

  const totalEvents =
    auditRecords.length;

  const recoveredEvents =
    auditRecords.filter(
      (a) => a.outcome === 'RECOVERED'
    ).length;

  const notRecoveredEvents =
    auditRecords.filter(
      (a) => a.outcome === 'NOT_RECOVERED'
    ).length;

  const blockedEvents =
    auditRecords.filter(
      (a) => a.outcome === 'BLOCKED'
    ).length;


  return (
    <div className="audit-page">

      {/* =====================================================
          AUDIT STATS
      ===================================================== */}

      <section className="audit-stats-banner">

        <div className="audit-stat-box">

          <span className="asb-label">
            TOTAL AUDITED EVENTS
          </span>

          <strong className="asb-val">
            {totalEvents}
          </strong>

        </div>


        <div className="audit-stat-box green">

          <span className="asb-label">
            SUCCESSFUL RECOVERIES
          </span>

          <strong className="asb-val green">
            {recoveredEvents}
          </strong>

        </div>


        <div className="audit-stat-box slate">

          <span className="asb-label">
            UNRECOVERED ATTEMPTS
          </span>

          <strong className="asb-val">
            {notRecoveredEvents}
          </strong>

        </div>


        <div className="audit-stat-box amber">

          <span className="asb-label">
            POLICY BLOCKS
          </span>

          <strong className="asb-val amber">
            {blockedEvents}
          </strong>

        </div>

      </section>


      {/* =====================================================
          AUDIT TABLE
      ===================================================== */}

      <section className="section-block">

        <AuditTable
          audit={auditRecords}
          isRecentPreview={false}
          onSelectAudit={onSelectAudit}
        />

      </section>

    </div>
  );
}