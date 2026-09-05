import React from 'react';
import { ArrowUpRight, TrendingUp, DollarSign, Percent, Zap, Repeat } from 'lucide-react';

export default function MetricCard({
  label,
  value,
  detail,
  positive = true,
  iconType,
  subtext
}) {
  const renderIcon = () => {
    switch (iconType) {
      case 'revenue':
        return <DollarSign size={18} />;
      case 'rate':
        return <Percent size={18} />;
      case 'incremental':
        return <Zap size={18} />;
      case 'attempts':
        return <Repeat size={18} />;
      default:
        return <TrendingUp size={18} />;
    }
  };

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span className="metric-label">{label}</span>
        <div className="metric-icon-bubble">{renderIcon()}</div>
      </div>

      <div className="metric-value-row">
        <span className="metric-value">{value}</span>
      </div>

      <div className="metric-footer">
        <span className={`metric-pill ${positive ? 'positive' : 'neutral'}`}>
          {positive && <ArrowUpRight size={12} />}
          {detail}
        </span>
        {subtext && <span className="metric-subtext">{subtext}</span>}
      </div>
    </div>
  );
}
