const express = require('express');
const { body } = require('express-validator');
const {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  toggleTask,
  deletePlan,
} = require('../controllers/planController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const planValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title max 100 chars'),
  body('type').isIn(['daily', 'weekly', 'monthly']).withMessage('Type must be daily, weekly, or monthly'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
];

router.use(protect);

router.route('/').get(getPlans).post(planValidation, createPlan);

router.route('/:id').get(getPlan).put(updatePlan).delete(deletePlan);

router.patch('/:id/tasks/:taskId', toggleTask);

module.exports = router;
