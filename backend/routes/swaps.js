const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult, param, query } = require('express-validator');
const Swap = require('../models/Swap');
const User = require('../models/User');
const { protect: auth } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// @route   GET /api/swaps/stats
// @desc    Get swap statistics for current user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Swap.aggregate([
      {
        $match: {
          $or: [
            { requester: mongoose.Types.ObjectId(userId) },
            { provider: mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]);

    const userStats = stats[0] || {
      total: 0,
      pending: 0,
      accepted: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0
    };

    delete userStats._id;

    res.json(userStats);
  } catch (error) {
    console.error('Get swap stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/swaps
// @desc    Create a new swap request
// @access  Private
router.post('/', [
  auth,
  body('toUserId').isMongoId().withMessage('Invalid toUser ID'),
  body('skillWanted.name').trim().isLength({ min: 1 }).withMessage('Skill wanted name is required'),
  body('skillOffered.name').trim().isLength({ min: 1 }).withMessage('Skill offered name is required'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1-1000 characters'),
  body('proposedDate').optional().isISO8601().withMessage('Invalid proposed date'),
  body('location').optional().isLength({ max: 200 }).withMessage('Location cannot be more than 200 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      toUserId, 
      skillWanted, 
      skillOffered, 
      message, 
      proposedDate, 
      location 
    } = req.body;

    // Ensure recipient exists and is active
    const toUser = await User.findById(toUserId);
    if (!toUser || !toUser.isActive) {
      return res.status(404).json({ message: 'Recipient not found or inactive' });
    }

    if (req.user.id === toUserId) {
      return res.status(400).json({ message: 'Cannot swap with yourself' });
    }

    const userHasSkill = toUser.skillsOffered.some(skill => skill.name.toLowerCase() === skillWanted.name.toLowerCase());
    if (!userHasSkill) {
      return res.status(400).json({ message: 'User does not offer the skill wanted' });
    }

    const myOfferedSkill = req.user.skillsOffered.some(skill => skill.name.toLowerCase() === skillOffered.name.toLowerCase());
    if (!myOfferedSkill) {
      return res.status(400).json({ message: 'You do not offer the skill proposed to exchange' });
    }

    const swapExists = await Swap.findOne({
      fromUser: req.user.id,
      toUser: toUserId,
      'skillWanted.name': new RegExp(skillWanted.name, 'i'),
      'skillOffered.name': new RegExp(skillOffered.name, 'i'),
      status: 'pending'
    });

    if (swapExists) {
      return res.status(400).json({ message: 'Pending swap already exists for these skills' });
    }

    const newSwap = new Swap({
      fromUser: req.user.id,
      toUser: toUserId,
      skillWanted: {
        name: skillWanted.name.trim(),
        priority: skillWanted.priority || 'Medium'
      },
      skillOffered: {
        name: skillOffered.name.trim(),
        level: skillOffered.level || 'Intermediate'
      },
      message,
      proposedDate,
      location,
      meetingType: 'flexible', // default to flexible
      duration: 1 // default to 1 hour
    });

    await newSwap.save();

    const populatedSwap = await Swap.findById(newSwap._id)
      .populate('fromUser', 'name profilePhoto location skillsOffered')
      .populate('toUser', 'name profilePhoto location skillsOffered');

    await NotificationService.notifySwapRequest({
      provider: newSwap.toUser,
      requester: newSwap.fromUser,
      skillOffered: newSwap.skillOffered.name,
      skillRequested: newSwap.skillWanted.name,
      swapId: newSwap._id
    });

    res.status(201).json({
      message: 'Swap request created',
      swap: populatedSwap
    });
  } catch (error) {
    console.error('Create swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/swaps
// @desc    Get user's swaps (sent and received)
// @access  Private
router.get('/', [
  auth,
  query('type').optional().isIn(['sent', 'received', 'all']).withMessage('Invalid type parameter'),
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']).withMessage('Invalid status parameter'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      type = 'all', 
      status, 
      page = 1, 
      limit = 10 
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query based on type
    let query = {};
    if (type === 'sent') {
      query.requester = req.user.id;
    } else if (type === 'received') {
      query.provider = req.user.id;
    } else {
      query.$or = [
        { requester: req.user.id },
        { provider: req.user.id }
      ];
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add archive filter (don't show archived swaps by default)
    query.isArchived = false;

    const swaps = await Swap.find(query)
      .populate('requester', 'name profilePhoto location rating')
      .populate('provider', 'name profilePhoto location rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Swap.countDocuments(query);

    res.json({
      swaps,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get swaps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/swaps/:swapId
// @desc    Get specific swap details
// @access  Private
router.get('/:swapId', [
  auth,
  param('swapId').isMongoId().withMessage('Invalid swap ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const swap = await Swap.findById(req.params.swapId)
      .populate('requester', 'name profilePhoto location rating skillsOffered')
      .populate('provider', 'name profilePhoto location rating skillsOffered')
      .populate('responses.from', 'name profilePhoto');

    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    // Check if user is part of this swap
    const isRequester = swap.requester._id.toString() === req.user.id;
    const isProvider = swap.provider._id.toString() === req.user.id;

    if (!isRequester && !isProvider) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(swap);
  } catch (error) {
    console.error('Get swap details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/swaps/:swapId/respond
// @desc    Respond to a swap request (accept/reject)
// @access  Private
router.put('/:swapId/respond', [
  auth,
  param('swapId').isMongoId().withMessage('Invalid swap ID'),
  body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject'),
  body('message').optional().trim().isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { action, message } = req.body;
    
    const swap = await Swap.findById(req.params.swapId);
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    // Check if user is the provider (only provider can accept/reject)
    if (swap.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the provider can respond to this swap' });
    }

    // Check if swap is still pending
    if (swap.status !== 'pending') {
      return res.status(400).json({ message: 'This swap has already been responded to' });
    }

    // Update swap status
    swap.status = action === 'accept' ? 'accepted' : 'rejected';
    
    if (action === 'accept') {
      swap.acceptedAt = new Date();
    } else {
      swap.rejectedAt = new Date();
    }

    // Add response message if provided
    if (message) {
      swap.responses.push({
        from: req.user.id,
        message: message.trim()
      });
    }

    await swap.save();

    // Populate the updated swap
    const populatedSwap = await Swap.findById(swap._id)
      .populate('requester', 'name profilePhoto location rating')
      .populate('provider', 'name profilePhoto location rating');

    // Trigger notifications based on action
    if (action === 'accept') {
      await NotificationService.notifySwapAccepted({
        provider: swap.provider,
        requester: swap.requester,
        providerName: populatedSwap.provider.name,
        skillRequested: swap.skillRequested.name,
        swapId: swap._id
      });
    } else {
      await NotificationService.notifySwapRejected({
        provider: swap.provider,
        requester: swap.requester,
        providerName: populatedSwap.provider.name,
        skillRequested: swap.skillRequested.name,
        swapId: swap._id
      });
    }

    res.json({
      message: `Swap ${action}ed successfully`,
      swap: populatedSwap
    });
  } catch (error) {
    console.error('Respond to swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/swaps/:swapId/complete
// @desc    Mark swap as completed
// @access  Private
router.put('/:swapId/complete', [
  auth,
  param('swapId').isMongoId().withMessage('Invalid swap ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const swap = await Swap.findById(req.params.swapId);
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    // Check if user is part of this swap
    const isRequester = swap.requester.toString() === req.user.id;
    const isProvider = swap.provider.toString() === req.user.id;

    if (!isRequester && !isProvider) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if swap is accepted
    if (swap.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted swaps can be marked as completed' });
    }

    // Update swap status
    swap.status = 'completed';
    swap.completedAt = new Date();

    await swap.save();

    // Populate the updated swap
    const populatedSwap = await Swap.findById(swap._id)
      .populate('requester', 'name profilePhoto location rating')
      .populate('provider', 'name profilePhoto location rating');

    // Trigger notification for swap completion
    await NotificationService.notifySwapCompleted({
      provider: swap.provider,
      requester: swap.requester,
      providerName: populatedSwap.provider.name,
      requesterName: populatedSwap.requester.name,
      swapId: swap._id
    });

    res.json({
      message: 'Swap marked as completed',
      swap: populatedSwap
    });
  } catch (error) {
    console.error('Complete swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/swaps/:swapId/cancel
// @desc    Cancel a swap
// @access  Private
router.put('/:swapId/cancel', [
  auth,
  param('swapId').isMongoId().withMessage('Invalid swap ID'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { reason } = req.body;
    
    const swap = await Swap.findById(req.params.swapId);
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    // Check if user is part of this swap
    const isRequester = swap.requester.toString() === req.user.id;
    const isProvider = swap.provider.toString() === req.user.id;

    if (!isRequester && !isProvider) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if swap can be cancelled
    if (!swap.canBeCancelled()) {
      return res.status(400).json({ message: 'This swap cannot be cancelled' });
    }

    // Update swap status
    swap.status = 'cancelled';
    swap.cancelledAt = new Date();

    // Add cancellation reason as a response
    if (reason) {
      swap.responses.push({
        from: req.user.id,
        message: `Cancellation reason: ${reason.trim()}`
      });
    }

    await swap.save();

    // Populate the updated swap
    const populatedSwap = await Swap.findById(swap._id)
      .populate('requester', 'name profilePhoto location rating')
      .populate('provider', 'name profilePhoto location rating');

    // Trigger notification for swap cancellation (if notification service exists)
    try {
      await NotificationService.notifySwapCancelled({
        cancelledBy: req.user.id,
        requester: swap.requester,
        provider: swap.provider,
        requesterName: populatedSwap.requester.name,
        providerName: populatedSwap.provider.name,
        reason,
        skillRequested: swap.skillRequested.name,
        swapId: swap._id
      });
    } catch (notificationError) {
      console.warn('Failed to send notification:', notificationError.message);
      // Continue without failing the main operation
    }

    res.json({
      message: 'Swap cancelled successfully',
      swap: populatedSwap
    });
  } catch (error) {
    console.error('Cancel swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/feedback/:swapId
// @desc    Submit feedback for a completed swap
// @access  Private
router.post('/:swapId/feedback', [
  auth,
  param('swapId').isMongoId().withMessage('Invalid swap ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { rating, comment } = req.body;
    
    const swap = await Swap.findById(req.params.swapId);
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    // Check if user can submit feedback
    if (!swap.canSubmitFeedback(req.user.id)) {
      return res.status(400).json({ 
        message: 'Cannot submit feedback for this swap' 
      });
    }

    const feedbackData = new Feedback({
      swap: swap._id,
      fromUser: req.user.id,
      toUser: swap.requester.toString() === req.user.id ? swap.provider : swap.requester,
      rating: parseInt(rating),
      comment: comment?.trim() || '',
      skillTaught: swap.skillOffered.name,
      skillLearned: swap.skillRequested.name
    });

    await feedbackData.save();

    // Trigger feedback received notification
    await NotificationService.notifyFeedbackReceived({
      recipient: feedbackData.toUser,
      sender: req.user.id,
      senderName: (await User.findById(req.user.id)).name,
      rating,
      swapId: swap._id
    });

    res.json({
      message: 'Feedback submitted successfully',
      feedback: feedbackData
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/swaps/:swapId/messages
// @desc    Add a message to swap conversation
// @access  Private
router.post('/:swapId/messages', [
  auth,
  param('swapId').isMongoId().withMessage('Invalid swap ID'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1-1000 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { message } = req.body;
    
    const swap = await Swap.findById(req.params.swapId);
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    // Check if user is part of this swap
    const isRequester = swap.requester.toString() === req.user.id;
    const isProvider = swap.provider.toString() === req.user.id;

    if (!isRequester && !isProvider) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add message to responses
    swap.responses.push({
      from: req.user.id,
      message: message.trim()
    });

    await swap.save();

    // Populate the updated swap with latest messages
    const populatedSwap = await Swap.findById(swap._id)
      .populate('responses.from', 'name profilePhoto')
      .select('responses');

    // Get sender name for notification
    const currentUser = await User.findById(req.user.id).select('name');
    
    // Trigger message received notification
    await NotificationService.notifyMessageReceived({
      recipient: isRequester ? swap.provider : swap.requester,
      sender: req.user.id,
      senderName: currentUser.name,
      swapId: swap._id
    });

    res.json({
      message: 'Message added successfully',
      responses: populatedSwap.responses
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/swaps/:swapId/archive
// @desc    Archive/unarchive a swap
// @access  Private
router.put('/:swapId/archive', [
  auth,
  param('swapId').isMongoId().withMessage('Invalid swap ID'),
  body('archive').isBoolean().withMessage('Archive must be a boolean')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { archive } = req.body;
    
    const swap = await Swap.findById(req.params.swapId);
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    // Check if user is part of this swap
    const isRequester = swap.requester.toString() === req.user.id;
    const isProvider = swap.provider.toString() === req.user.id;

    if (!isRequester && !isProvider) {
      return res.status(403).json({ message: 'Access denied' });
    }

    swap.isArchived = archive;
    await swap.save();

    res.json({
      message: `Swap ${archive ? 'archived' : 'unarchived'} successfully`,
      isArchived: swap.isArchived
    });
  } catch (error) {
    console.error('Archive swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
