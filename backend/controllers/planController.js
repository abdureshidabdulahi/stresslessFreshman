const { validationResult } = require('express-validator');
const Plan = require('../models/Plan');

// @desc    Get all plans for logged-in user
// @route   GET /api/plans
// @access  Private
const getPlans = async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = { user: req.user._id };

    if (type) filter.type = type;
    if (status) filter.status = status;

    const plans = await Plan.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, count: plans.length, plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error fetching plans' });
  }
};

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Private
const getPlan = async (req, res) => {
  try {
    const plan = await Plan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new plan
// @route   POST /api/plans
// @access  Private
const createPlan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, type, tasks, startDate, endDate, color } = req.body;

    const plan = await Plan.create({
      user: req.user._id,
      title,
      description,
      type,
      tasks: tasks || [],
      startDate,
      endDate,
      color: color || '#4f46e5',
    });

    res.status(201).json({ success: true, plan });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ message: 'Server error creating plan' });
  }
};

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private
const updatePlan = async (req, res) => {
  try {
    let plan = await Plan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      plan[key] = updates[key];
    });

    await plan.save();

    res.json({ success: true, plan });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Server error updating plan' });
  }
};

// @desc    Toggle task completion
// @route   PATCH /api/plans/:id/tasks/:taskId
// @access  Private
const toggleTask = async (req, res) => {
  try {
    const plan = await Plan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const task = plan.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.completed = !task.completed;
    await plan.save();

    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error toggling task' });
  }
};

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Private
const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting plan' });
  }
};

module.exports = { getPlans, getPlan, createPlan, updatePlan, toggleTask, deletePlan };
