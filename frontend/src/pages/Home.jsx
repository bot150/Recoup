import React from 'react';
import { ArrowRight, BrainCircuit, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="public-page home-page">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <span className="public-brand-mark">R</span>
          <span>RECOUP</span>
        </Link>

        <nav className="public-nav">
          <a href="#how-it-works">How it works</a>
          <Link to="/login">Login</Link>
          <Link to="/signup" className="public-header-cta">
            Get Started
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-live-dot" />
              ADAPTIVE AI REVENUE RECOVERY
            </div>

            <h1>
              Recover more revenue.
              <br />
              <span>Automatically.</span>
            </h1>

            <p className="hero-description">
              Recoup detects revenue at risk, predicts the likelihood of
              recovery, chooses the right intervention and timing, and executes
              a bounded recovery workflow.
            </p>

            <div className="hero-actions">
              <Link to="/signup" className="primary-cta">
                Get Started
                <ArrowRight size={17} />
              </Link>

              <Link to="/login" className="secondary-cta">
                Login
              </Link>
            </div>

            <p className="hero-note">
              Built for intelligent, policy-controlled payment recovery.
            </p>
          </div>

          <div className="hero-visual">
            <div className="hero-orb" />

            <div className="recovery-preview">
              <div className="preview-header">
                <span>RECOVERY ENGINE</span>
                <span className="preview-status">ACTIVE</span>
              </div>

              <div className="preview-payment">
                <div>
                  <span className="preview-label">PAYMENT AT RISK</span>
                  <strong>₹4,280</strong>
                </div>
                <span className="risk-badge">RECOVERY CANDIDATE</span>
              </div>

              <div className="preview-line">
                <span>Predicted recovery</span>
                <strong>78.4%</strong>
              </div>

              <div className="preview-line">
                <span>Selected action</span>
                <strong>NUDGE</strong>
              </div>

              <div className="preview-line">
                <span>Optimal timing</span>
                <strong>+12 hours</strong>
              </div>

              <div className="preview-agent">
                <span className="preview-agent-dot" />
                Agent decision optimized
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <span>DETECT</span>
          <span>→</span>
          <span>PREDICT</span>
          <span>→</span>
          <span>OPTIMIZE</span>
          <span>→</span>
          <span>ACT</span>
          <span>→</span>
          <span>STOP</span>
        </section>

        <section id="how-it-works" className="how-section">
          <div className="section-heading">
            <span className="section-eyebrow">HOW RECOUP WORKS</span>
            <h2>An agent that knows more than just "retry."</h2>
            <p>
              Traditional recovery systems react to payment failures.
              Recoup evaluates context and decides why, when, and how to act.
            </p>
          </div>

          <div className="feature-grid">
            <Feature
              icon={BarChart3}
              number="01"
              title="Detect"
              text="Identify failed and at-risk payments before revenue is permanently lost."
            />

            <Feature
              icon={BrainCircuit}
              number="02"
              title="Predict"
              text="Estimate recovery probability from payment and customer behavior."
            />

            <Feature
              icon={Zap}
              number="03"
              title="Optimize"
              text="Compare action and timing combinations using expected monetary value."
            />

            <Feature
              icon={ShieldCheck}
              number="04"
              title="Act safely"
              text="Execute bounded recovery workflows with deterministic policy guardrails."
            />
          </div>
        </section>

        <section className="difference-section">
          <div>
            <span className="section-eyebrow">WHY RECOUP</span>
            <h2>WHY. WHEN. WHAT ACTION.</h2>
          </div>

          <div className="difference-copy">
            <p>
              Recoup is not a simple failed-payment retry system.
              It evaluates multiple recovery strategies and chooses the
              intervention with the highest expected value while respecting
              recovery limits.
            </p>

            <div className="difference-points">
              <div>
                <strong>WHY</strong>
                <span>Understand the failure context.</span>
              </div>
              <div>
                <strong>WHEN</strong>
                <span>Choose the customer's most promising payment window.</span>
              </div>
              <div>
                <strong>WHAT</strong>
                <span>Select the intervention with the best expected recovery.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="final-cta-section">
          <span className="section-eyebrow">RECOUP</span>
          <h2>Turn revenue at risk into recovered revenue.</h2>
          <Link to="/signup" className="primary-cta">
            Start with Recoup
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>

      <footer className="public-footer">
        <span>RECOUP — Adaptive AI Revenue Recovery Agent</span>
        <span>AI-powered • Policy-controlled • Auditable</span>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, number, title, text }) {
  return (
    <div className="feature-card">
      <div className="feature-top">
        <span>{number}</span>
        <Icon size={20} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}