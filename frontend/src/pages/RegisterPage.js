import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      toast.success('Account created! Welcome to StressLess Freshman 🎉');
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
          <h1>Create your account</h1>
          <p>Start your stress-free academic journey today</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__group">
            <label htmlFor="name">Full name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </div>

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
            <label htmlFor="password">
              Password
              <span className="auth-form__hint">At least 6 characters</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-form__submit btn btn--primary"
            disabled={loading}
          >
            {loading ? <span className="auth-form__spinner" /> : 'Create account'}
          </button>
        </form>

        <p className="auth-card__switch">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
