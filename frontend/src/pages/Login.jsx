import React, { useState } from 'react';
import { ArrowLeft, Globe, Loader2, LockKeyhole } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, signInWithGoogle } from '../services/auth';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/overview', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
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
      setError(err.message || 'Google sign-in failed.');
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
          <h1>Welcome back</h1>
          <p>Sign in to your revenue recovery control center.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

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
          <span>or continue with email</span>
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
              placeholder="••••••••"
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
              <LockKeyhole size={17} />
            )}
            Sign in
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}