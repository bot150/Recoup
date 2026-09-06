const API_BASE_URL = 'http://127.0.0.1:8000';

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      `API request failed (${response.status})`
    );
  }

  return data;
}


// ============================================================
// HEALTH
// ============================================================

export async function checkHealth() {
  return apiRequest('/api/health');
}


// ============================================================
// PAYMENTS
// ============================================================

export async function getPayments() {
  return apiRequest('/api/payments');
}


// ============================================================
// MOCK CHECKOUT
// ============================================================

export async function createMockFailure({
  amount,
  method,
  failure_reason = 'BANK_ERROR',
}) {
  return apiRequest(
    '/api/payments/mock-failure',
    {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(amount),
        method,
        failure_reason,
      }),
    }
  );
}


// ============================================================
// RECOVERY
// ============================================================

export async function recoverPayment(paymentId) {
  if (!paymentId) {
    throw new Error('Payment ID is required.');
  }

  return apiRequest(
    `/api/recover/${encodeURIComponent(paymentId)}`,
    {
      method: 'POST',
    }
  );
}


// ============================================================
// AUDIT
// ============================================================

export async function getAudit() {
  return apiRequest('/api/audit');
}

export async function getRecentAudit() {
  return apiRequest('/api/audit/recent');
}


// ============================================================
// EVALUATION
// ============================================================

export async function getEvaluation() {
  return apiRequest('/api/evaluation');
}


// ============================================================
// SUMMARY
// ============================================================

export async function getSummary() {
  return apiRequest('/api/summary');
}


// ============================================================
// DEFAULT API
// ============================================================

const api = {
  checkHealth,
  getPayments,
  createMockFailure,
  recoverPayment,
  getAudit,
  getRecentAudit,
  getEvaluation,
  getSummary,
};

export default api;