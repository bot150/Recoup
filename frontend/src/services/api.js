// ============================================================
// RECOUP API SERVICE
// ============================================================

const API_BASE_URL = 'http://127.0.0.1:8000';

async function fetchJson(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[Recoup API Warning] Failed to fetch ${endpoint}:`, error.message);
    throw error;
  }
}

export async function fetchHealth() {
  return await fetchJson('/api/health');
}

export async function fetchSummary() {
  return await fetchJson('/api/summary');
}

export async function fetchAudit() {
  const data = await fetchJson('/api/audit');
  return data.records || [];
}

export async function fetchRecentAudit() {
  const data = await fetchJson('/api/audit/recent');
  return data.records || [];
}

export async function fetchPayments() {
  const data = await fetchJson('/api/payments');
  return data.payments || [];
}

export async function fetchEvaluation() {
  const data = await fetchJson('/api/evaluation');
  return data.results || [];
}

/**
 * Execute recovery for a payment ID.
 * If backend endpoint is available, posts to it.
 * Otherwise returns a clear unsupported object so UI displays demo state.
 */
export async function executeRecovery(paymentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recover/${paymentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      return { success: true, data: await response.json() };
    }
  } catch {
    // Backend endpoint POST /api/recover/{payment_id} does not exist in FastAPI backend main.py
  }
  return {
    success: false,
    connected: false,
    message: 'Recovery execution API not connected yet.',
  };
}
