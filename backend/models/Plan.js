const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
});

const planSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Plan title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: [true, 'Plan type is required'],
    },
    tasks: [taskSchema],
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    color: {
      type: String,
      default: '#4f46e5',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'overdue'],
      default: 'active',
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate completion percentage before save
planSchema.pre('save', function (next) {
  if (this.tasks && this.tasks.length > 0) {
    const completed = this.tasks.filter((t) => t.completed).length;
    this.completionPercentage = Math.round((completed / this.tasks.length) * 100);
  } else {
    this.completionPercentage = 0;
  }

  // Check if overdue
  if (this.endDate < new Date() && this.completionPercentage < 100) {
    this.status = 'overdue';
  } else if (this.completionPercentage === 100) {
    this.status = 'completed';
  }

  next();
});

module.exports = mongoose.model('Plan', planSchema);
