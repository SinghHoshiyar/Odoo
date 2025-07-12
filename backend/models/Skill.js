const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Skill name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Skill description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['Technology', 'Arts', 'Sports', 'Music', 'Languages', 'Cooking', 'Business', 'Academic', 'Crafts', 'Other'],
    default: 'Other'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isRejected: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot be more than 500 characters']
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
SkillSchema.index({ name: 1 });
SkillSchema.index({ category: 1, isApproved: 1 });
SkillSchema.index({ isApproved: 1, createdAt: -1 });

module.exports = mongoose.model('Skill', SkillSchema);
