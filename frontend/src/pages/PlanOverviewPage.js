import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../utils/api';
import CountdownTimer from '../components/CountdownTimer';
import PlanModal from '../components/PlanModal';
import './PlansPage.css';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const STATUS_COLORS = {
  active: 'var(--accent-emerald)',
  completed: 'var(--accent-indigo)',
  overdue: 'var(--accent-rose)',
};

export default function PlanOverviewPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/plans');
      const filteredPlans = statusFilter
        ? data.plans.filter((plan) => plan.status === statusFilter)
        : data.plans;
      setPlans(filteredPlans);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this plan?')) return;
    try {
      await API.delete(`/plans/${id}`);
      setPlans((p) => p.filter((plan) => plan._id !== id));
      toast.success('Plan deleted');
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  const handleModalSuccess = (plan, isEdit) => {
    if (isEdit) {
      setPlans((p) => p.map((pl) => (pl._id === plan._id ? plan : pl)));
    } else {
      setPlans((p) => [plan, ...p]);
    }
    setModalOpen(false);
    setEditPlan(null);
  };

  return (
    <div className="plans-page animate-fade-in">
      <div className="plans-page__header">
        <div>
          <h1>Plan Overview</h1>
          <p>See your total plans and switch between active, completed, and overdue lists.</p>
        </div>
        <button className="btn btn--primary" onClick={() => { setEditPlan(null); setModalOpen(true); }}>
          + Create Plan
        </button>
      </div>

      <div className="plans-page__filters">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            className={`plans-page__filter-btn ${statusFilter === value ? 'plans-page__filter-btn--active' : ''}`}
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              if (value) {
                nextParams.set('status', value);
              } else {
                nextParams.delete('status');
              }
              setSearchParams(nextParams);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="plans-page__grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="plan-card plan-card--skeleton" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="plans-page__empty">
          <span>📋</span>
          <h3>No plans found</h3>
          <p>
            {statusFilter
              ? `No ${statusFilter} plans found. Create one!`
              : 'Create your first plan to get started.'}
          </p>
          <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
            + Create your first plan
          </button>
        </div>
      ) : (
        <div className="plans-page__grid">
          {plans.map((plan) => (
            <Link
              key={plan._id}
              to={`/plans/${plan._id}`}
              className="plan-card"
              style={{ '--plan-color': plan.color }}
            >
              <div className="plan-card__header">
                <div className="plan-card__meta">
                  <span className="plan-card__type">{plan.type}</span>
                  <span className="plan-card__status" style={{ color: STATUS_COLORS[plan.status] }}>
                    ● {plan.status}
                  </span>
                </div>
                <button
                  className="plan-card__delete"
                  onClick={(e) => handleDelete(plan._id, e)}
                  title="Delete plan"
                  aria-label="Delete plan"
                >
                  ✕
                </button>
              </div>

              <h3 className="plan-card__title">{plan.title}</h3>
              {plan.description && <p className="plan-card__desc">{plan.description}</p>}

              <CountdownTimer endDate={plan.endDate} compact />

              <div className="plan-card__progress">
                <div className="plan-card__progress-bar">
                  <div className="plan-card__progress-fill" style={{ width: `${plan.completionPercentage}%` }} />
                </div>
                <span className="plan-card__progress-text">{plan.completionPercentage}%</span>
              </div>

              <div className="plan-card__footer">
                <span className="plan-card__tasks">
                  {plan.tasks.filter((t) => t.completed).length}/{plan.tasks.length} tasks
                </span>
                <span className="plan-card__date">
                  Due {new Date(plan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {modalOpen && (
        <PlanModal
          onClose={() => { setModalOpen(false); setEditPlan(null); }}
          defaultType="daily"
          onSuccess={handleModalSuccess}
          editPlan={editPlan}
        />
      )}
    </div>
  );
}
