const mongoose = require('mongoose');

const SwapSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillRequested: {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    }
  },
  skillOffered: {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    }
  },
  message: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  proposedSchedule: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    timeSlots: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      startTime: String,
      endTime: String
    }]
  },
  actualSchedule: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    sessions: [{
      date: Date,
      duration: Number, // in minutes
      completed: {
        type: Boolean,
        default: false
      },
      notes: String
    }]
  },
  feedback: {
    requesterFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: [500, 'Feedback comment cannot be more than 500 characters']
      },
      submittedAt: Date
    },
    providerFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: [500, 'Feedback comment cannot be more than 500 characters']
      },
      submittedAt: Date
    }
  },
  responses: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [1000, 'Response message cannot be more than 1000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  completedAt: {
    type: Date
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
SwapSchema.index({ requester: 1, status: 1 });
SwapSchema.index({ provider: 1, status: 1 });
SwapSchema.index({ status: 1, createdAt: -1 });

// Virtual for duration calculation
SwapSchema.virtual('totalDuration').get(function() {
  if (!this.actualSchedule || !this.actualSchedule.sessions) return 0;
  return this.actualSchedule.sessions.reduce((total, session) => {
    return total + (session.duration || 0);
  }, 0);
});

// Method to check if swap can be cancelled
SwapSchema.methods.canBeCancelled = function() {
  return ['pending', 'accepted'].includes(this.status);
};

// Method to check if feedback can be submitted
SwapSchema.methods.canSubmitFeedback = function(userId) {
  if (this.status !== 'completed') return false;
  
  const isRequester = this.requester.toString() === userId.toString();
  const isProvider = this.provider.toString() === userId.toString();
  
  if (isRequester && this.feedback.requesterFeedback.rating) return false;
  if (isProvider && this.feedback.providerFeedback.rating) return false;
  
  return isRequester || isProvider;
};

module.exports = mongoose.model('Swap', SwapSchema);
