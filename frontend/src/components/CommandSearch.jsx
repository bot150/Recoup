import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CreditCard, User, AlertCircle, ArrowRight } from 'lucide-react';
import { formatIndianCurrency } from '../services/formatters';

export default function CommandSearch({ isOpen, onClose, payments, audit, onSelectPayment }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search triggered by shortcut
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Search matching payments
  const matchingPayments = query.trim() === '' ? payments.slice(0, 6) : payments.filter(p => {
    const q = query.toLowerCase().trim();
    return (
      (p.payment_id && p.payment_id.toLowerCase().includes(q)) ||
      (p.customer_id && p.customer_id.toLowerCase().includes(q)) ||
      (p.failure_reason && p.failure_reason.toLowerCase().includes(q)) ||
      (p.payment_method && p.payment_method.toLowerCase().includes(q))
    );
  }).slice(0, 10);

  return (
    <div className="command-search-overlay" onClick={onClose}>
      <div className="command-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="command-search-header">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type payment ID, customer ID, or failure reason... (ESC to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="command-input"
          />
          {query && (
            <button className="clear-query-btn" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="command-search-body">
          <div className="command-section-title">
            <span>{query ? 'MATCHING PAYMENTS' : 'RECENT PAYMENTS'}</span>
            <kbd>↑ ↓ to navigate</kbd>
          </div>

          <div className="command-results-list">
            {matchingPayments.length === 0 ? (
              <div className="command-empty">
                <AlertCircle size={20} />
                <p>No matching payments found for "{query}"</p>
              </div>
            ) : (
              matchingPayments.map((p) => (
                <div
                  key={p.payment_id}
                  className="command-result-item"
                  onClick={() => {
                    onSelectPayment(p);
                    onClose();
                  }}
                >
                  <div className="result-left">
                    <div className="result-icon">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <strong className="result-payment-id">{p.payment_id}</strong>
                      <span className="result-meta">
                        {p.customer_id} • {p.payment_method}
                      </span>
                    </div>
                  </div>

                  <div className="result-right">
                    <span className="result-failure-tag">{p.failure_reason}</span>
                    <strong className="result-amount">{formatIndianCurrency(p.amount, false)}</strong>
                    <ArrowRight size={14} className="hover-arrow" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="command-search-footer">
          <span>Press <strong>Enter</strong> to select payment detail drawer</span>
          <span><strong>Esc</strong> to close</span>
        </div>
      </div>
    </div>
  );
}
