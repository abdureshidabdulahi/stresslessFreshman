import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../utils/api';
import './PlanModal.css';

const COLORS = [
  '#0000ff', '#0c11ff', '#2f43ff', '#5672ff',
  '#85a3ff', '#b3c8ff', '#d5e2ff', '#e8efff',
];

const calculateEndDate = (startDate, planType) => {
  const start = new Date(startDate);
  const end = new Date(start);
  
  switch (planType) {
    case 'daily':
      end.setDate(end.getDate() + 1); // 24 hours (1 day)
      break;
    case 'weekly':
      end.setDate(end.getDate() + 7); // 7 days
      break;
    case 'monthly':
      end.setDate(end.getDate() + 30); // 30 days
      break;
    default:
      end.setDate(end.getDate() + 1);
  }
  
  return end.toISOString().split('T')[0];
};

const defaultForm = () => {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  return {
    title: '',
    description: '',
    type: 'daily',
    startDate: todayString,
    endDate: calculateEndDate(todayString, 'daily'),
    color: '#0000ff',
    tasks: [],
  };
};

export default function PlanModal({ onClose, onSuccess, editPlan, defaultType = 'daily' }) {
  const [form, setForm] = useState(defaultForm);
  const [taskInput, setTaskInput] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [taskError, setTaskError] = useState(false);

  useEffect(() => {
    if (editPlan) {
      setForm({
        title: editPlan.title,
        description: editPlan.description || '',
        type: editPlan.type,
        startDate: new Date(editPlan.startDate).toISOString().split('T')[0],
        endDate: new Date(editPlan.endDate).toISOString().split('T')[0],
        color: editPlan.color,
        tasks: editPlan.tasks || [],
      });
    }
  }, [editPlan]);

  // If there's no editPlan, update the form type when defaultType changes
  useEffect(() => {
    if (!editPlan) {
      setForm((f) => {
        const start = f.startDate || new Date().toISOString().split('T')[0];
        const type = defaultType || 'daily';
        return {
          ...f,
          type,
          endDate: calculateEndDate(start, type),
        };
      });
    }
  }, [defaultType, editPlan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updatedForm = { ...f, [name]: value };
      
      // Auto-calculate end date when type or startDate changes
      if (name === 'type' || name === 'startDate') {
        updatedForm.endDate = calculateEndDate(updatedForm.startDate, updatedForm.type);
      }
      
      return updatedForm;
    });
  };

  const addTask = () => {
    const title = taskInput.trim();
    if (!title) return;
    setForm((f) => ({
      ...f,
      tasks: [...f.tasks, { title, priority: taskPriority, completed: false }],
    }));
    setTaskInput('');
    setTaskPriority('medium');
    setTaskError(false);
  };

  const removeTask = (index) => {
    setForm((f) => ({ ...f, tasks: f.tasks.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.tasks || form.tasks.length === 0) { setTaskError(true); toast.error('Please add at least one task'); return; }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      let data;
      if (editPlan) {
        const res = await API.put(`/plans/${editPlan._id}`, payload);
        data = res.data;
      } else {
        const res = await API.post('/plans', payload);
        data = res.data;
      }
      toast.success(editPlan ? 'Plan updated!' : 'Plan created! 🎯');
      onSuccess(data.plan, !!editPlan);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save plan';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const priorityColors = { low: '#b3c8ff', medium: '#85a3ff', high: '#5672ff' };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in-scale">
        <div className="modal__header">
          <h2>{editPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="modal__scroll">
            {/* Title */}
            <div className="modal__group">
              <label>Plan Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Study for Biology Midterm"
                required
              />
            </div>

            {/* Description */}
            <div className="modal__group">
              <label>Description (optional)</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What does this plan involve?"
                rows={2}
              />
            </div>

            {/* Type + Color */}
            <div className="modal__row">
              <div className="modal__group">
                <label>Plan Type *</label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="modal__group">
                <label>Color</label>
                <div className="modal__colors">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`modal__color-btn ${form.color === c ? 'modal__color-btn--selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="modal__row">
              <div className="modal__group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="modal__group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Tasks */}
            <div className="modal__group">
              <label>Tasks ({form.tasks.length})</label>
              <div className={`modal__task-input ${taskError ? 'modal__task-input--error' : ''}`}>
                <input
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Add a task..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                />
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="modal__priority-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button type="button" className="modal__add-task btn btn--primary btn--sm" onClick={addTask}>
                  Add
                </button>
              </div>

              {form.tasks.length > 0 && (
                <div className="modal__tasks-list">
                  {form.tasks.map((task, i) => (
                    <div key={i} className="modal__task-item">
                      <span
                        className="modal__task-priority"
                        style={{ background: `${priorityColors[task.priority]}20`, color: priorityColors[task.priority] }}
                      >
                        {task.priority}
                      </span>
                      <span className="modal__task-title">{task.title}</span>
                      <button
                        type="button"
                        className="modal__task-remove"
                        onClick={() => removeTask(i)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? (
                <span className="auth-form__spinner" style={{ width: 16, height: 16 }} />
              ) : editPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
