const mongoose = require('mongoose');

const PlatformMessageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Message title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot be more than 2000 characters']
  },
  type: {
    type: String,
    enum: ['announcement', 'maintenance', 'update', 'warning', 'celebration'],
    default: 'announcement'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sendEmail: {
    type: Boolean,
    default: false
  },
  targetAudience: {
    type: String,
    enum: ['all', 'new_users', 'active_users', 'premium_users'],
    default: 'all'
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    sentCount: {
      type: Number,
      default: 0
    },
    readCount: {
      type: Number,
      default: 0
    },
    clickCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
PlatformMessageSchema.index({ isActive: 1, priority: -1, sentAt: -1 });
PlatformMessageSchema.index({ targetAudience: 1, isActive: 1 });
PlatformMessageSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('PlatformMessage', PlatformMessageSchema);
