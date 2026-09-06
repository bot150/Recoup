import React, { useState } from 'react';
import {
  ArrowLeft,
  Globe,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, signInWithGoogle } from '../services/auth';

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    date_of_birth: '',
    business_name: '',
    bank_account_last4: '',
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState('');
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
    setMessage('');

    if (!form.full_name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!form.username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (form.bank_account_last4) {
      if (!/^\d{4}$/.test(form.bank_account_last4)) {
        setError('Bank account must contain exactly 4 digits.');
        return;
      }
    }

    setLoading(true);

    try {
      const data = await signUp(
        form.email,
        form.password,
        {
          full_name: form.full_name.trim(),
          username: form.username.trim(),
          phone: form.phone.trim(),
          date_of_birth: form.date_of_birth,
          business_name: form.business_name.trim(),
          bank_account_last4: form.bank_account_last4.trim(),
        }
      );

      if (data?.session) {
        navigate('/overview', { replace: true });
      } else {
        setMessage(
          'Account created successfully. Check your email to confirm your account, then sign in.'
        );
      }

    } catch (err) {
      setError(
        err.message || 'Unable to create account.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setGoogleLoading(false);

      setError(
        err.message || 'Google sign-up failed.'
      );
    }
  };

  return (
    <div className="auth-page">

      <Link
        to="/"
        className="auth-back"
      >
        <ArrowLeft size={16} />
        Back to Recoup
      </Link>

      <div className="auth-card">

        <div className="auth-logo">
          R
        </div>

        <div className="auth-heading">

          <span className="section-eyebrow">
            RECOUP
          </span>

          <h1>
            Create your account
          </h1>

          <p>
            Set up your Recoup recovery workspace.
          </p>

        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success">
            {message}
          </div>
        )}

        {/* GOOGLE */}

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
        >

          {googleLoading ? (
            <Loader2
              size={18}
              className="auth-spinner"
            />
          ) : (
            <Globe size={18} />
          )}

          Continue with Google

        </button>

        <div className="auth-divider">
          <span>
            or create with email
          </span>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          <label>
            Full Name

            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
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
              placeholder="@username"
              required
            />

          </label>

          <label>
            Email

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />

          </label>

          <label>
            Phone

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />

          </label>

          <label>
            Date of Birth

            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
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
            />

          </label>

          <label>
            Password

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
            />

          </label>

          <label>
            Confirm Password

            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              required
            />

          </label>

          <button
            type="submit"
            className="primary-auth-btn"
            disabled={loading || googleLoading}
          >

            {loading ? (
              <Loader2
                size={18}
                className="auth-spinner"
              />
            ) : (
              <UserPlus size={17} />
            )}

            {loading
              ? 'Creating account...'
              : 'Create account'
            }

          </button>

        </form>

        <p className="auth-switch">

          Already have an account?

          {' '}

          <Link to="/login">
            Sign in
          </Link>

        </p>

      </div>
    </div>
  );
}