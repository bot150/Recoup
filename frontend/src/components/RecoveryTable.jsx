import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  AlertCircle, 
  CreditCard,
  Calendar,
  Layers
} from 'lucide-react';
import { formatIndianCurrency, formatDateTime } from '../services/formatters';

export default function RecoveryTable({ payments, onSelectPayment }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [amountFilter, setAmountFilter] = useState('ALL');
  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Unique lists for filter options
  const failureReasons = useMemo(() => {
    const set = new Set(payments.map(p => p.failure_reason).filter(Boolean));
    return Array.from(set);
  }, [payments]);

  const paymentMethods = useMemo(() => {
    const set = new Set(payments.map(p => p.payment_method).filter(Boolean));
    return Array.from(set);
  }, [payments]);

  // Filtering logic
  const filteredPayments = useMemo(() => {
    return payments.filter(item => {
      // Search filter
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        (item.payment_id && item.payment_id.toLowerCase().includes(term)) ||
        (item.customer_id && item.customer_id.toLowerCase().includes(term));

      // Reason filter
      const matchesReason = reasonFilter === 'ALL' || item.failure_reason === reasonFilter;

      // Method filter
      const matchesMethod = methodFilter === 'ALL' || item.payment_method === methodFilter;

      // Amount filter
      const amt = Number(item.amount) || 0;
      let matchesAmount = true;
      if (amountFilter === 'LOW') matchesAmount = amt < 1000;
      else if (amountFilter === 'MID') matchesAmount = amt >= 1000 && amt <= 2500;
      else if (amountFilter === 'HIGH') matchesAmount = amt > 2500;

      return matchesSearch && matchesReason && matchesMethod && matchesAmount;
    });
  }, [payments, searchTerm, reasonFilter, methodFilter, amountFilter]);

  // Sorting logic
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'amount') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPayments, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedPayments.length / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPayments.slice(start, start + pageSize);
  }, [sortedPayments, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="panel recovery-table-panel">
      <div className="table-controls-bar">
        {/* Search input */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Payment ID or Customer ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="table-search-input"
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>

        {/* Filters group */}
        <div className="filters-group">
          {/* Reason Filter */}
          <select
            value={reasonFilter}
            onChange={(e) => {
              setReasonFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="ALL">All Failure Reasons</option>
            {failureReasons.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="ALL">All Payment Methods</option>
            {paymentMethods.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Amount Filter */}
          <select
            value={amountFilter}
            onChange={(e) => {
              setAmountFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="ALL">All Amounts</option>
            <option value="LOW">&lt; ₹1,000</option>
            <option value="MID">₹1,000 – ₹2,500</option>
            <option value="HIGH">&gt; ₹2,500</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-responsive-wrapper">
        <table className="recovery-data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('payment_id')} className="sortable-th">
                <div className="th-content">
                  <span>Payment ID</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>

              <th>Customer</th>

              <th onClick={() => handleSort('amount')} className="sortable-th text-right">
                <div className="th-content align-right">
                  <span>Amount</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>

              <th>Failure Reason</th>
              <th>Payment Method</th>

              <th onClick={() => handleSort('timestamp')} className="sortable-th">
                <div className="th-content">
                  <span>Timestamp</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>

              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-table-cell">
                  <div className="table-empty-state">
                    <AlertCircle size={24} />
                    <p>No failed payments matching the selected criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedPayments.map((item) => (
                <tr
                  key={item.payment_id}
                  onClick={() => onSelectPayment(item)}
                  className="clickable-table-row"
                >
                  <td>
                    <span className="payment-id-cell">{item.payment_id}</span>
                  </td>

                  <td>
                    <span className="customer-id-cell">{item.customer_id || 'N/A'}</span>
                  </td>

                  <td className="text-right">
                    <strong className="amount-cell-bold">
                      {formatIndianCurrency(item.amount, false)}
                    </strong>
                  </td>

                  <td>
                    <span className="failure-tag-pill">
                      {item.failure_reason || 'UNKNOWN'}
                    </span>
                  </td>

                  <td>
                    <span className="method-tag-pill">
                      {item.payment_method || 'UPI'}
                    </span>
                  </td>

                  <td>
                    <span className="timestamp-cell">
                      {formatDateTime(item.timestamp)}
                    </span>
                  </td>

                  <td>
                    <span className="status-badge failed">
                      ● {item.status || 'FAILED'}
                    </span>
                  </td>

                  <td>
                    <button
                      className="row-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPayment(item);
                      }}
                    >
                      <span>Details</span>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination-footer">
        <span className="pagination-info">
          Showing {paginatedPayments.length} of {sortedPayments.length} payments
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
    </div>
  );
}
