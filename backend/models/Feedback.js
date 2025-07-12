const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  swap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Swap',
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: [500, 'Feedback comment cannot be more than 500 characters'],
    trim: true
  },
  skillTaught: {
    type: String,
    required: true
  },
  skillLearned: {
    type: String,
    required: true
  },
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    enum: [
      'patient', 'knowledgeable', 'helpful', 'friendly', 'professional',
      'punctual', 'well-prepared', 'clear-communicator', 'enthusiastic',
      'needs-improvement', 'unreliable', 'unprepared'
    ]
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
FeedbackSchema.index({ toUser: 1, isPublic: 1, isArchived: 1 });
FeedbackSchema.index({ fromUser: 1, createdAt: -1 });
FeedbackSchema.index({ swap: 1 });
FeedbackSchema.index({ rating: -1, createdAt: -1 });

// Virtual for feedback age
FeedbackSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to get average rating for a user
FeedbackSchema.statics.getAverageRating = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        toUser: mongoose.Types.ObjectId(userId),
        isPublic: true,
        isArchived: false
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalFeedbacks: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalFeedbacks: 0,
      ratingDistribution: {}
    };
  }

  const ratings = result[0].ratingDistribution;
  const distribution = {};
  
  for (let i = 1; i <= 5; i++) {
    distribution[i] = ratings.filter(r => r === i).length;
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalFeedbacks: result[0].totalFeedbacks,
    ratingDistribution: distribution
  };
};

// Static method to get recent feedback for a user
FeedbackSchema.statics.getRecentFeedback = async function(userId, limit = 5) {
  return await this.find({
    toUser: userId,
    isPublic: true,
    isArchived: false
  })
  .populate('fromUser', 'name profilePhoto')
  .populate('swap', 'skillOffered skillRequested')
  .sort({ createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Feedback', FeedbackSchema);
