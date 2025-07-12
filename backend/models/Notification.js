const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'swap_request',
      'swap_accepted',
      'swap_rejected',
      'swap_completed',
      'swap_cancelled',
      'feedback_received',
      'message_received',
      'skill_approved',
      'skill_rejected',
      'platform_message',
      'account_banned',
      'account_unbanned'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  data: {
    swapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Swap'
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlatformMessage'
    },
    // Additional data can be stored here
    metadata: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notification
NotificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', NotificationSchema);
