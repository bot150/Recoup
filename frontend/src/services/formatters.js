// ============================================================
// RECOUP FORMATTING UTILITIES
// ============================================================

/**
 * Format Indian currency with options for compact representation (Lakhs)
 * Example: 1387407.84 -> ₹13.87L (compact) or ₹13,87,407.84 (full)
 */
export function formatIndianCurrency(amount, compact = true) {
  const num = Number(amount) || 0;
  
  if (compact && Math.abs(num) >= 100000) {
    const lakhs = (num / 100000).toFixed(2);
    return `₹${lakhs}L`;
  }
  
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format standard percentage
 * Example: 0.8512 -> 85.12% or 85.12 -> 85.12%
 */
export function formatPercent(value, rawDecimal = false) {
  const num = Number(value) || 0;
  const percentage = rawDecimal ? num * 100 : num;
  return `${percentage.toFixed(2)}%`;
}

/**
 * Format probability value
 * Example: 0.63 -> 63.0%
 */
export function formatProbability(value) {
  const num = Number(value) || 0;
  const pct = num <= 1 ? num * 100 : num;
  return `${pct.toFixed(1)}%`;
}

/**
 * Format raw numbers with Indian locale
 */
export function formatNumber(num) {
  return Number(num || 0).toLocaleString('en-IN');
}

/**
 * Format timestamp into readable date time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Action cost lookup (in INR)
 */
export const ACTION_COSTS = {
  SMART_RETRY: 0.50,
  PAYMENT_LINK: 1.00,
  NUDGE: 0.20,
  STOP: 0.00
};

/**
 * Calculate expected recovery: (Amount * Probability) - Action Cost
 */
export function calculateExpectedRecovery(amount, probability, action) {
  const amt = Number(amount) || 0;
  const prob = Number(probability) || 0;
  const cost = ACTION_COSTS[action] ?? 0.50;
  const expected = (amt * prob) - cost;
  return Math.max(0, expected);
}
