import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '📋',
    title: 'Smart Planning',
    desc: 'Create daily, weekly, and monthly plans with task tracking and deadline countdowns.',
    color: '#3b82f6',
  },
  {
    icon: '⏱️',
    title: 'Live Countdowns',
    desc: 'Never miss a deadline. See exactly how much time remains for every plan.',
    color: '#10b981',
  },
  {
    icon: '📚',
    title: 'Learning Library',
    desc: 'Evidence-based articles on motivation, hard work, and building academic success.',
    color: '#f59e0b',
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing__header">
        <div className="landing__header-inner">
          <div className="landing__logo">
            <span className="landing__logo-star">✦</span>
            <span>StressLess Freshman</span>
          </div>
          <div className="landing__header-actions">
            <Link to="/login" className="btn btn--ghost">Sign in</Link>
            <Link to="/register" className="btn btn--primary">Get started free</Link>
          </div>
        </div>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-inner">
          <div className="landing__badge">Built for first-year students</div>
          <h1 className="landing__headline">
            Your freshman year,<br />
            <em>without the overwhelm.</em>
          </h1>
          <p className="landing__subheadline">
            Plan your academics with clarity. Stay motivated with curated knowledge.
            Track progress toward the results that shape your future.
          </p>
          <div className="landing__cta-group">
            <Link to="/register" className="btn btn--primary btn--lg">
              Start planning today
            </Link>
            <Link to="/login" className="btn btn--ghost btn--lg">
              Already have an account →
            </Link>
          </div>

          <div className="landing__stats">
            <div className="landing__stat">
              <span className="landing__stat-value">3</span>
              <span className="landing__stat-label">Plan types</span>
            </div>
            <div className="landing__stat-divider" />
            <div className="landing__stat">
              <span className="landing__stat-value">8</span>
              <span className="landing__stat-label">Expert articles</span>
            </div>
            <div className="landing__stat-divider" />
            <div className="landing__stat">
              <span className="landing__stat-value">∞</span>
              <span className="landing__stat-label">Motivation</span>
            </div>
          </div>
        </div>

        <div className="landing__glow" />
      </section>

      <section className="landing__features">
        <div className="landing__features-inner">
          <h2 className="landing__section-title">Everything you need to succeed</h2>
          <div className="landing__feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing__feature-card">
                <div className="landing__feature-icon" style={{ background: `${f.color}18`, color: f.color }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing__quote">
        <div className="landing__quote-inner">
          <blockquote>
            "The secret of getting ahead is getting started. The secret of getting started
            is breaking your complex, overwhelming tasks into small, manageable tasks,
            and then starting on the first one."
          </blockquote>
          <cite>— Mark Twain</cite>
        </div>
      </section>

      <footer className="landing__footer">
        <p>© 2024 StressLess Freshman · Built for students, by students</p>
      </footer>
    </div>
  );
}
