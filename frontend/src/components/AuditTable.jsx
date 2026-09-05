import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { formatIndianCurrency, formatProbability, formatDateTime } from '../services/formatters';

export default function AuditTable({ audit = [], isRecentPreview = false, onSelectAudit }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = isRecentPreview ? 5 : 12;

  // Filtered audit list
  const filteredAudit = useMemo(() => {
    return audit.filter(item => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        (item.payment_id && item.payment_id.toLowerCase().includes(term)) ||
        (item.customer_id && item.customer_id.toLowerCase().includes(term));

      const matchesOutcome = outcomeFilter === 'ALL' || item.outcome === outcomeFilter;
      const matchesAction = actionFilter === 'ALL' || item.selected_action === actionFilter;

      return matchesSearch && matchesOutcome && matchesAction;
    });
  }, [audit, searchTerm, outcomeFilter, actionFilter]);

  // Sorted list
  const sortedAudit = useMemo(() => {
    return [...filteredAudit].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'amount' || sortField === 'recovered_amount' || sortField === 'expected_recovery') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAudit, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedAudit.length / pageSize) || 1;
  const paginatedAudit = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAudit.slice(start, start + pageSize);
  }, [sortedAudit, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="panel audit-table-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">{isRecentPreview ? 'TRACEABILITY PREVIEW' : 'IMMUTABLE AUDIT TRAIL'}</span>
          <h2 className="panel-title">{isRecentPreview ? 'Recent Decision Events' : 'Agent Action Audit Log'}</h2>
        </div>
        <span className="audit-event-count">
          {audit.length} total events recorded
        </span>
      </div>

      {!isRecentPreview && (
        <div className="table-controls-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search audit by Payment ID or Customer ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="table-search-input"
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>

          <div className="filters-group">
            <select
              value={outcomeFilter}
              onChange={(e) => {
                setOutcomeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="ALL">All Outcomes</option>
              <option value="RECOVERED">RECOVERED</option>
              <option value="NOT_RECOVERED">NOT_RECOVERED</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="ALL">All Actions</option>
              <option value="SMART_RETRY">SMART_RETRY</option>
              <option value="PAYMENT_LINK">PAYMENT_LINK</option>
              <option value="NUDGE">NUDGE</option>
            </select>
          </div>
        </div>
      )}

      <div className="table-responsive-wrapper">
        <table className="audit-data-table">
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
          </colgroup>
          <thead>
            <tr>
              <th onClick={() => handleSort('timestamp')} className="sortable-th">
                <div className="th-content">
                  <span>Timestamp</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>

              <th>Payment ID</th>
              <th>Customer</th>

              <th onClick={() => handleSort('amount')} className="sortable-th text-right">
                <div className="th-content align-right">
                  <span>Amount</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>

              <th>Failure Reason</th>
              <th>Selected Action</th>
              <th>Timing</th>
              <th>Probability</th>

              <th onClick={() => handleSort('expected_recovery')} className="sortable-th text-right">
                <div className="th-content align-right">
                  <span>Expected Rec.</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>

              <th>Policy</th>
              <th>Outcome</th>

              <th onClick={() => handleSort('recovered_amount')} className="sortable-th text-right">
                <div className="th-content align-right">
                  <span>Recovered</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedAudit.length === 0 ? (
              <tr>
                <td colSpan={12} className="empty-table-cell">
                  <div className="table-empty-state">
                    <AlertCircle size={24} />
                    <p>No audit events found matching filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedAudit.map((event, idx) => {
                const isRecovered = event.outcome === 'RECOVERED';
                const isBlocked = event.outcome === 'BLOCKED';

                return (
                  <tr
                    key={`${event.payment_id}-${idx}`}
                    onClick={() => onSelectAudit(event)}
                    className="clickable-table-row"
                  >
                    <td>
                      <span className="timestamp-cell">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </td>

                    <td>
                      <span className="payment-id-cell">{event.payment_id}</span>
                    </td>

                    <td>
                      <span className="customer-id-cell">{event.customer_id}</span>
                    </td>

                    <td className="text-right">
                      <strong className="amount-cell-bold">
                        {formatIndianCurrency(event.amount, false)}
                      </strong>
                    </td>

                    <td>
                      <span className="failure-tag-pill">
                        {event.failure_reason}
                      </span>
                    </td>

                    <td>
                      <span className="action-tag-pill">
                        {event.selected_action}
                      </span>
                    </td>

                    <td>
                      <span className="timing-cell">
                        +{event.selected_timing_hours}h
                      </span>
                    </td>

                    <td>
                      <span className="prob-cell green">
                        {formatProbability(event.selected_probability)}
                      </span>
                    </td>

                    <td className="text-right">
                      <span className="expected-cell green">
                        {formatIndianCurrency(event.expected_recovery, false)}
                      </span>
                    </td>

                    <td>
                      <span className="policy-allowed-badge">
                        ✓ Allowed
                      </span>
                    </td>

                    <td>
                      <span className={`outcome-badge ${isRecovered ? 'recovered' : isBlocked ? 'blocked' : 'not-recovered'}`}>
                        ● {event.outcome}
                      </span>
                    </td>

                    <td className="text-right">
                      <strong className={`recovered-cell ${isRecovered ? 'green' : 'slate'}`}>
                        {formatIndianCurrency(event.recovered_amount, false)}
                      </strong>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isRecentPreview && (
        <div className="table-pagination-footer">
          <span className="pagination-info">
            Showing {paginatedAudit.length} of {sortedAudit.length} audit records
          </span>

          <div className="pagination-buttons">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
