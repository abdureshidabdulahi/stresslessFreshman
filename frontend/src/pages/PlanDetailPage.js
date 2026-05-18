import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../utils/api';
import CountdownTimer from '../components/CountdownTimer';
import './PlanDetailPage.css';

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f43f5e',
};

export default function PlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskInput, setTaskInput] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [addingTask, setAddingTask] = useState(false);

  const fetchPlan = useCallback(async () => {
    try {
      const { data } = await API.get(`/plans/${id}`);
      setPlan(data.plan);
    } catch {
      toast.error('Plan not found');
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleToggleTask = async (taskId) => {
    try {
      const { data } = await API.patch(`/plans/${id}/tasks/${taskId}`);
      setPlan(data.plan);
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const title = taskInput.trim();
    if (!title) return;
    setAddingTask(true);
    try {
      const updatedTasks = [
        ...plan.tasks,
        { title, priority: taskPriority, completed: false },
      ];
      const { data } = await API.put(`/plans/${id}`, { tasks: updatedTasks });
      setPlan(data.plan);
      setTaskInput('');
      setTaskPriority('medium');
      toast.success('Task added');
    } catch {
      toast.error('Failed to add task');
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await API.delete(`/plans/${id}`);
      toast.success('Plan deleted');
      navigate('/plans');
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  if (loading) {
    return (
      <div className="plan-detail animate-fade-in">
        <div className="plan-detail__skeleton-header" />
        <div className="plan-detail__skeleton-body" />
      </div>
    );
  }

  if (!plan) return null;

  const completedCount = plan.tasks.filter((t) => t.completed).length;
  const totalCount = plan.tasks.length;

  return (
    <div className="plan-detail animate-fade-in">
      {/* Breadcrumb */}
      <div className="plan-detail__breadcrumb">
        <Link to="/plans">← My Plans</Link>
        <span>/</span>
        <span>{plan.title}</span>
      </div>

      {/* Header */}
      <div className="plan-detail__header" style={{ '--plan-color': plan.color }}>
        <div className="plan-detail__header-color-bar" />
        <div className="plan-detail__header-content">
          <div className="plan-detail__header-top">
            <div>
              <div className="plan-detail__meta">
                <span className="plan-detail__type">{plan.type}</span>
                <span className={`plan-detail__status plan-detail__status--${plan.status}`}>
                  {plan.status}
                </span>
              </div>
              <h1 className="plan-detail__title">{plan.title}</h1>
              {plan.description && (
                <p className="plan-detail__description">{plan.description}</p>
              )}
            </div>
            <button
              className="plan-detail__delete-btn"
              onClick={handleDeletePlan}
              title="Delete plan"
            >
              🗑 Delete
            </button>
          </div>

          <div className="plan-detail__dates">
            <span>
              📅 {new Date(plan.startDate).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
            <span className="plan-detail__dates-arrow">→</span>
            <span>
              🏁 {new Date(plan.endDate).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="plan-detail__body">
        {/* Left column */}
        <div className="plan-detail__left">
          {/* Progress */}
          <div className="plan-detail__card">
            <h2 className="plan-detail__card-title">Progress</h2>
            <div className="plan-detail__progress-ring-wrap">
              <svg className="plan-detail__progress-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={plan.color}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - plan.completionPercentage / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="56" textAnchor="middle" className="plan-detail__ring-pct" fill="var(--text-primary)" fontSize="20" fontWeight="700">
                  {plan.completionPercentage}%
                </text>
                <text x="60" y="74" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">
                  complete
                </text>
              </svg>
            </div>
            <p className="plan-detail__progress-text">
              {completedCount} of {totalCount} task{totalCount !== 1 ? 's' : ''} done
            </p>
          </div>

          {/* Countdown */}
          <div className="plan-detail__card">
            <h2 className="plan-detail__card-title">Countdown</h2>
            <CountdownTimer endDate={plan.endDate} />
          </div>
        </div>

        {/* Right column – Tasks */}
        <div className="plan-detail__right">
          <div className="plan-detail__card">
            <h2 className="plan-detail__card-title">
              Tasks
              <span className="plan-detail__task-badge">
                {completedCount}/{totalCount}
              </span>
            </h2>

            {/* Add task form */}
            <form className="plan-detail__add-task" onSubmit={handleAddTask}>
              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add a new task..."
                className="plan-detail__task-input"
              />
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="plan-detail__priority-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                type="submit"
                className="btn btn--primary btn--sm"
                disabled={addingTask || !taskInput.trim()}
              >
                {addingTask ? '…' : 'Add'}
              </button>
            </form>

            {/* Task list */}
            {plan.tasks.length === 0 ? (
              <div className="plan-detail__no-tasks">
                <span>📝</span>
                <p>No tasks yet. Add your first task above.</p>
              </div>
            ) : (
              <div className="plan-detail__task-list">
                {plan.tasks.map((task) => (
                  <div
                    key={task._id}
                    className={`plan-detail__task ${task.completed ? 'plan-detail__task--done' : ''}`}
                  >
                    <button
                      className="plan-detail__task-check"
                      onClick={() => handleToggleTask(task._id)}
                      aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                      style={{ '--check-color': plan.color }}
                    >
                      {task.completed ? '✓' : ''}
                    </button>
                    <span className="plan-detail__task-title">{task.title}</span>
                    <span
                      className="plan-detail__task-priority"
                      style={{
                        color: PRIORITY_COLORS[task.priority],
                        background: `${PRIORITY_COLORS[task.priority]}18`,
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
