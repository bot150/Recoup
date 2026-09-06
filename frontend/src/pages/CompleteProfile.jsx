import React, { useState } from 'react';
import {
  User,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../services/auth';

export default function CompleteProfile({ user }) {
  const navigate = useNavigate();

  const existing = user?.user_metadata || {};

  const [form, setForm] = useState({
    full_name: existing.full_name || '',
    username: existing.username || '',
    phone: existing.phone || '',
    date_of_birth: existing.date_of_birth || '',
    business_name: existing.business_name || '',
    bank_account_last4:
      existing.bank_account_last4 || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!form.full_name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!form.username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (!form.phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    if (!form.date_of_birth) {
      setError('Please enter your date of birth.');
      return;
    }

    if (!form.business_name.trim()) {
      setError('Please enter your business name.');
      return;
    }

    if (!/^\d{4}$/.test(form.bank_account_last4)) {
      setError(
        'Enter exactly the last 4 digits of your bank account.'
      );
      return;
    }

    setLoading(true);

    try {
      await updateProfile(form);

      navigate('/overview', {
        replace: true,
      });

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Unable to save your profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          R
        </div>

        <div className="auth-heading">

          <span className="section-eyebrow">
            RECOUP
          </span>

          <h1>
            Complete your profile
          </h1>

          <p>
            Tell us a little more about yourself
            and your business.
          </p>

        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <label>
            Full Name

            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </label>


          <label>
            Username

            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
            />
          </label>


          <label>
            Phone Number

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Your phone number"
              required
            />
          </label>


          <label>
            Date of Birth

            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              required
            />
          </label>


          <label>
            Business Name

            <input
              type="text"
              name="business_name"
              value={form.business_name}
              onChange={handleChange}
              placeholder="Your business name"
              required
            />
          </label>


          <label>
            Bank Account — Last 4 Digits

            <input
              type="text"
              name="bank_account_last4"
              value={form.bank_account_last4}
              onChange={handleChange}
              placeholder="e.g. 4821"
              maxLength={4}
              inputMode="numeric"
              required
              onInput={(e) => {
                e.target.value =
                  e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 4);
              }}
            />
          </label>


          <button
            type="submit"
            className="primary-auth-btn"
            disabled={loading}
          >

            {loading ? (
              <Loader2
                size={18}
                className="auth-spinner"
              />
            ) : (
              <ArrowRight size={18} />
            )}

            {loading
              ? 'Saving profile...'
              : 'Continue to Recoup'}

          </button>

        </form>

      </div>

    </div>
  );
}