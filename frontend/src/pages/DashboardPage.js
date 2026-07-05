import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import CountdownTimer from '../components/CountdownTimer';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await API.get('/plans');
        setPlans(data.plans);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const activePlans = plans.filter((p) => p.status === 'active');
  const completedPlans = plans.filter((p) => p.status === 'completed');
  const overduePlans = plans.filter((p) => p.status === 'overdue');
  const upcomingDeadlines = [...activePlans, ...overduePlans]
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    .slice(0, 3);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard animate-fade-in">
      {/* Hero Greeting */}
      <div className="dashboard__greeting">
        <div>
          <p className="dashboard__greeting-sub">{greeting} 👋</p>
          <h1 className="dashboard__greeting-name">{user?.name}</h1>
          <p className="dashboard__greeting-msg">
            {activePlans.length === 0
              ? "You have no active plans. Let's create one!"
              : `You have ${activePlans.length} active plan${activePlans.length !== 1 ? 's' : ''} in progress.`}
          </p>
        </div>
        <Link to="/plans" className="btn btn--primary">
          + New Plan
        </Link>
      </div>

      {/* Stats */}
      <div className="dashboard__stats">
        <Link to="/plans" className="dashboard__stat-card dashboard__stat-card--blue">
          <div className="dashboard__stat-value">{plans.length}</div>
          <div className="dashboard__stat-label">Total Plans</div>
        </Link>
        <Link to="/plans?status=active" className="dashboard__stat-card dashboard__stat-card--emerald">
          <div className="dashboard__stat-value">{activePlans.length}</div>
          <div className="dashboard__stat-label">Active</div>
        </Link>
        <Link to="/plans?status=completed" className="dashboard__stat-card dashboard__stat-card--amber">
          <div className="dashboard__stat-value">{completedPlans.length}</div>
          <div className="dashboard__stat-label">Completed</div>
        </Link>
        <Link to="/plans?status=overdue" className="dashboard__stat-card dashboard__stat-card--rose">
          <div className="dashboard__stat-value">{overduePlans.length}</div>
          <div className="dashboard__stat-label">Overdue</div>
        </Link>
      </div>

      <div className="dashboard__columns">
        {/* Upcoming Deadlines + Countdowns */}
        <div className="dashboard__section">
          <div className="dashboard__section-header">
            <h2>Upcoming Deadlines</h2>
            <Link to="/plans" className="dashboard__section-link">View all →</Link>
          </div>

          {loading ? (
            <div className="dashboard__loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="dashboard__skeleton" />
              ))}
            </div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="dashboard__empty">
              <span>🎯</span>
              <p>No upcoming deadlines</p>
              <Link to="/plans" className="btn btn--ghost btn--sm">Create a plan</Link>
            </div>
          ) : (
            <div className="dashboard__deadlines">
              {upcomingDeadlines.map((plan) => (
                <Link
                  key={plan._id}
                  to={`/plans/${plan._id}`}
                  className="dashboard__deadline-card"
                  style={{ '--plan-color': plan.color }}
                >
                  <div className="dashboard__deadline-header">
                    <span className="dashboard__deadline-type">{plan.type}</span>
                    <span
                      className={`dashboard__deadline-status dashboard__deadline-status--${plan.status}`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <h3 className="dashboard__deadline-title">{plan.title}</h3>
                  <CountdownTimer endDate={plan.endDate} compact />
                  <div className="dashboard__deadline-progress">
                    <div
                      className="dashboard__deadline-bar"
                      style={{ width: `${plan.completionPercentage}%` }}
                    />
                  </div>
                  <span className="dashboard__deadline-pct">
                    {plan.completionPercentage}% complete
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="dashboard__section">
          <div className="dashboard__section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="dashboard__quick-actions">
            <Link to="/plans?type=daily" className="dashboard__quick-card">
              <span className="dashboard__quick-icon">📅</span>
              <div>
                <h4>Daily Plan</h4>
                <p>Plan today's tasks</p>
              </div>
            </Link>
            <Link to="/plans?type=weekly" className="dashboard__quick-card">
              <span className="dashboard__quick-icon">📆</span>
              <div>
                <h4>Weekly Plan</h4>
                <p>This week's goals</p>
              </div>
            </Link>
            <Link to="/plans?type=monthly" className="dashboard__quick-card">
              <span className="dashboard__quick-icon">🗓️</span>
              <div>
                <h4>Monthly Plan</h4>
                <p>Big picture goals</p>
              </div>
            </Link>
            <Link to="/learn" className="dashboard__quick-card">
              <span className="dashboard__quick-icon">📚</span>
              <div>
                <h4>Learn & Grow</h4>
                <p>Boost your mindset</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
