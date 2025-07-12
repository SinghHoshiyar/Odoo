const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { protect: auth } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('unreadOnly').optional().isBoolean().withMessage('UnreadOnly must be a boolean')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const result = await NotificationService.getUserNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });

    res.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put('/:notificationId/read', [
  auth,
  param('notificationId').isMongoId().withMessage('Invalid notification ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const notification = await NotificationService.markAsRead(
      req.params.notificationId, 
      req.user.id
    );

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);

    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const result = await NotificationService.getUserNotifications(req.user.id, {
      page: 1,
      limit: 1,
      unreadOnly: true
    });

    res.json({
      unreadCount: result.unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
