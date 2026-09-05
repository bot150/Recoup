import React, { useState } from 'react';
import { ArrowLeft, Globe, Loader2, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, signInWithGoogle } from '../services/auth';

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await signUp(email, password);

      if (data?.session) {
        navigate('/overview', { replace: true });
      } else {
        setMessage(
          'Account created. Check your email to confirm your account, then sign in.'
        );
      }
    } catch (err) {
      setError(err.message || 'Unable to create account.');
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
      setError(err.message || 'Google sign-up failed.');
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-back">
        <ArrowLeft size={16} />
        Back to Recoup
      </Link>

      <div className="auth-card">
        <div className="auth-logo">R</div>

        <div className="auth-heading">
          <span className="section-eyebrow">RECOUP</span>
          <h1>Create your account</h1>
          <p>Start using adaptive AI revenue recovery.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <Loader2 size={18} className="auth-spinner" />
          ) : (
            <Globe size={18} />
          )}
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or create with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              <Loader2 size={18} className="auth-spinner" />
            ) : (
              <UserPlus size={17} />
            )}
            Create account
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}