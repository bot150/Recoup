import React, { useState, useEffect } from 'react';
import { RefreshCw, Menu, Search, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Header({
  activeTab,
  onRefresh,
  isRefreshing,
  lastUpdated,
  apiOnline,
  setMobileOpen,
  onOpenSearch
}) {
  const [timeAgo, setTimeAgo] = useState('Just now');

  useEffect(() => {
    if (!lastUpdated) return;

    const updateLabel = () => {
      const seconds = Math.floor((new Date() - lastUpdated) / 1000);
      if (seconds < 5) {
        setTimeAgo('Just now');
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else {
        const mins = Math.floor(seconds / 60);
        setTimeAgo(`${mins}m ago`);
      }
    };

    updateLabel();
    const interval = setInterval(updateLabel, 3000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const titles = {
    overview: {
      title: 'Recovery Overview',
      subtitle: 'Adaptive AI decisions for failed payments.',
      eyebrow: 'REVENUE RECOVERY CONTROL CENTER'
    },
    recovery: {
      title: 'Recovery Operations',
      subtitle: 'Review failed payments and launch bounded recovery workflows.',
      eyebrow: 'WORKFLOW ENGINE'
    },
    decisions: {
      title: 'Agent Decisions',
      subtitle: 'Every recovery decision is optimized for expected monetary value and constrained by policy.',
      eyebrow: 'DECISION EXPLORER'
    },
    audit: {
      title: 'Audit Trail',
      subtitle: 'Every recovery decision is traceable with end-to-end policy execution logs.',
      eyebrow: 'COMPLIANCE & TRACEABILITY'
    }
  };

  const current = titles[activeTab] || titles.overview;

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="mobile-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <span className="header-eyebrow">{current.eyebrow}</span>
          <h1 className="header-title">{current.title}</h1>
          <p className="header-subtitle">{current.subtitle}</p>
        </div>
      </div>

      <div className="header-right">
        {/* Connection status badge */}
        <div className={`api-status-badge ${apiOnline ? 'online' : 'offline'}`}>
          {apiOnline ? (
            <>
              <CheckCircle2 size={13} />
              <span>API Online</span>
            </>
          ) : (
            <>
              <AlertTriangle size={13} />
              <span>API Offline (Fallback)</span>
            </>
          )}
        </div>

        {/* AI Recovery Active pill */}
        <div className="live-status-pill">
          <span className="live-dot" />
          <span>AI Recovery Active</span>
        </div>

        {/* Synthetic Evaluation Badge */}
        <div className="synthetic-badge">
          <ShieldCheck size={12} />
          <span>SYNTHETIC EVALUATION</span>
        </div>

        {/* Search trigger on header */}
        <button className="header-search-btn" onClick={onOpenSearch} title="Search (Ctrl + K)">
          <Search size={15} />
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
          title="Refresh dashboard data"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span className="refresh-label">{timeAgo}</span>
        </button>
      </div>
    </header>
  );
}
