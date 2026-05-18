import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Welcome back! 🎓');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__glow" />
      <div className="auth-card animate-fade-in">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo">
            <span>✦</span> StressLess Freshman
          </Link>
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@university.edu"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-form__group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-form__submit btn btn--primary"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-form__spinner" />
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="auth-card__switch">
          Don't have an account?{' '}
          <Link to="/register">Create one for free</Link>
        </p>
      </div>
    </div>
  );
}
