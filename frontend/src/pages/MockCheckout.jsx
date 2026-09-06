import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://recoup-api-953t.onrender.com';

export default function MockCheckout() {
  const navigate = useNavigate();

  const [method, setMethod] = useState('UPI');
  const [amount, setAmount] = useState('');
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPayment, setSavedPayment] = useState(null);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payments/mock-failure`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: numericAmount,
            method: method,
            failure_reason: 'BANK_ERROR',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || 'Failed to create payment.'
        );
      }

      setSavedPayment(data.payment);
      setFailed(true);
    } catch (err) {
      console.error(err);
      setError(
        err.message || 'Could not save failed payment.'
      );
    } finally {
      setSaving(false);
    }
  };

  const continueToRecoup = () => {
  if (!savedPayment?.payment_id) {
    setError('Payment was not saved.');
    return;
  }

  window.location.href =
    `/recovery?payment=${savedPayment.payment_id}`;
};

  const resetCheckout = () => {
    setFailed(false);
    setSavedPayment(null);
    setError('');
  };

  return (
    <div className="mock-checkout-page">
      <div className="mock-checkout-card">

        <div className="mock-brand">
          <div className="mock-brand-mark">
            R
          </div>

          <div>
            <strong>RECOUP STORE</strong>
            <span>Secure Checkout</span>
          </div>
        </div>

        <div className="mock-product">
          <div>
            <span className="mock-label">
              PREMIUM SUBSCRIPTION
            </span>

            <h1>Recoup Pro</h1>

            <p>
              Adaptive revenue recovery platform
            </p>
          </div>

          <strong className="mock-price">
            ₹{Number(amount || 0).toFixed(2)}
          </strong>
        </div>

        {!failed && (
          <>
            <div className="mock-section-title">
              Enter payment amount
            </div>

            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mock-amount-input"
              placeholder="Enter amount"
            />

            <div className="mock-section-title">
              Select payment method
            </div>

            <div className="mock-methods">
              {['UPI', 'CARD', 'NET BANKING'].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    className={`mock-method ${
                      method === item ? 'selected' : ''
                    }`}
                    onClick={() => setMethod(item)}
                  >
                    <CreditCard size={18} />
                    <span>{item}</span>
                  </button>
                )
              )}
            </div>

            <div className="mock-payment-info">
              <div>
                <span>Amount</span>
                <strong>
                  ₹{Number(amount || 0).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Payment method</span>
                <strong>{method}</strong>
              </div>
            </div>

            {error && (
              <div className="mock-error-message">
                {error}
              </div>
            )}

            <button
              type="button"
              className="mock-pay-button"
              onClick={handlePayment}
              disabled={saving}
            >
              {saving
                ? 'Processing...'
                : `Pay ₹${Number(amount || 0).toFixed(2)}`}

              {!saving && <ArrowRight size={18} />}
            </button>

            <div className="mock-secure">
              <ShieldCheck size={15} />
              <span>
                Simulated checkout • Demo environment
              </span>
            </div>
          </>
        )}

        {failed && (
          <div className="mock-failure">

            <div className="mock-failure-icon">
              <AlertCircle size={30} />
            </div>

            <span className="mock-failure-label">
              PAYMENT FAILED
            </span>

            <h2>
              We couldn't process your payment
            </h2>

            <p>
              The payment gateway returned:
            </p>

            <div className="mock-error-code">
              BANK_ERROR
            </div>

            <div className="mock-recoup-message">
              <strong>
                Recoup detected this failed payment.
              </strong>

              <span>
                Payment ID: {savedPayment?.payment_id}
              </span>

              <span>
                The recovery agent can now analyze
                the best action and timing.
              </span>
            </div>

            {error && (
              <div className="mock-error-message">
                {error}
              </div>
            )}

            <button
              type="button"
              className="mock-pay-button"
              onClick={continueToRecoup}
            >
              Send to Recoup
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="mock-back-button"
              onClick={resetCheckout}
            >
              Try another payment
            </button>

          </div>
        )}

      </div>
    </div>
  );
}