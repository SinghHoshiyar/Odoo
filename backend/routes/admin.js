const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { isAdmin } = require('../middleware/admin');
const Skill = require('../models/Skill');
const PlatformMessage = require('../models/PlatformMessage');
const User = require('../models/User');
const Swap = require('../models/Swap');

const router = express.Router();

// @route   GET /api/admin/skills/pending
// @desc    Get pending skill submissions
// @access  Admin
router.get('/skills/pending', isAdmin, async (req, res) => {
  try {
    const pendingSkills = await Skill.find({ isApproved: false, isRejected: false });
    res.json(pendingSkills);
  } catch (error) {
    console.error('Admin fetch pending skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/skills/:skillId/reject
// @desc    Reject a skill submission
// @access  Admin
router.put('/skills/:skillId/reject',
  [
    isAdmin,
    body('rejectionReason').trim().isLength({ min: 1, max: 500 }).withMessage('Rejection reason must be specified')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const skill = await Skill.findById(req.params.skillId);
      if (!skill) {
        return res.status(404).json({ message: 'Skill not found' });
      }

      skill.isRejected = true;
      skill.rejectionReason = req.body.rejectionReason.trim();
      skill.reviewedAt = new Date();
      skill.reviewedBy = req.user.id;

      await skill.save();

      res.json({ message: 'Skill rejected successfully' });
    } catch (error) {
      console.error('Admin reject skill error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/admin/skills/:skillId/approve
// @desc    Approve a skill submission
// @access  Admin
router.put('/skills/:skillId/approve', isAdmin, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    skill.isApproved = true;
    skill.isRejected = false; // Clear rejection if any
    skill.reviewedAt = new Date();
    skill.reviewedBy = req.user.id;

    await skill.save();

    res.json({ message: 'Skill approved successfully' });
  } catch (error) {
    console.error('Admin approve skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:userId/ban
// @desc    Ban a user
// @access  Admin
router.put('/users/:userId/ban',
  [
    isAdmin,
    body('banReason').trim().isLength({ min: 1, max: 500 }).withMessage('Ban reason must be specified')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.isBanned = true;
      user.banReason = req.body.banReason.trim();
      user.bannedAt = new Date();

      await user.save();

      res.json({ message: 'User banned successfully' });
    } catch (error) {
      console.error('Admin ban user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/admin/messages
// @desc    Send a platform-wide message
// @access  Admin
router.post('/messages',
  [
    isAdmin,
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content is required'),
    body('type').optional().isIn(['announcement', 'maintenance', 'update', 'warning', 'celebration']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content, type, priority, sendEmail, targetAudience, expiresAt } = req.body;

      const message = new PlatformMessage({
        title,
        content,
        type: type || 'announcement',
        priority: priority || 'medium',
        sendEmail: sendEmail || false,
        targetAudience: targetAudience || 'all',
        sentBy: req.user.id,
        expiresAt: expiresAt || null
      });

      await message.save();

      res.status(201).json({ message: 'Platform message sent successfully' });
    } catch (error) {
      console.error('Send platform message error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/admin/users/:userId/unban
// @desc    Unban a user
// @access  Admin
router.put('/users/:userId/unban', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBanned = false;
    user.banReason = undefined;
    user.bannedAt = undefined;

    await user.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Admin unban user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/swaps/monitor
// @desc    Monitor swap activities
// @access  Admin
router.get('/swaps/monitor', [
  isAdmin,
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
      query.status = status;
    }

    const swaps = await Swap.find(query)
      .populate('requester', 'name email location')
      .populate('provider', 'name email location')
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
    console.error('Admin monitor swaps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/reports/download
// @desc    Download platform reports
// @access  Admin
router.get('/reports/download', [
  isAdmin,
  query('type').isIn(['users', 'swaps', 'skills', 'messages']).withMessage('Invalid report type'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format')
], async (req, res) => {
  try {
    const { type, format = 'json' } = req.query;
    let data;
    let filename;

    switch (type) {
      case 'users':
        data = await User.find({}).select('-password');
        filename = `users_report_${Date.now()}.${format}`;
        break;
      case 'swaps':
        data = await Swap.find({})
          .populate('requester', 'name email')
          .populate('provider', 'name email');
        filename = `swaps_report_${Date.now()}.${format}`;
        break;
      case 'skills':
        data = await Skill.find({});
        filename = `skills_report_${Date.now()}.${format}`;
        break;
      case 'messages':
        data = await PlatformMessage.find({});
        filename = `messages_report_${Date.now()}.${format}`;
        break;
    }

    if (format === 'csv') {
      // Simple CSV conversion (for production, use a proper CSV library)
      const csvData = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.json(data);
    }
  } catch (error) {
    console.error('Admin download reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/dashboard/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard/stats', isAdmin, async (req, res) => {
  try {
    const [totalUsers, totalSwaps, totalSkills, totalMessages] = await Promise.all([
      User.countDocuments({}),
      Swap.countDocuments({}),
      Skill.countDocuments({}),
      PlatformMessage.countDocuments({})
    ]);

    const [activeUsers, pendingSwaps, pendingSkills, bannedUsers] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Swap.countDocuments({ status: 'pending' }),
      Skill.countDocuments({ isApproved: false, isRejected: false }),
      User.countDocuments({ isBanned: true })
    ]);

    res.json({
      totals: {
        users: totalUsers,
        swaps: totalSwaps,
        skills: totalSkills,
        messages: totalMessages
      },
      active: {
        users: activeUsers,
        pendingSwaps,
        pendingSkills,
        bannedUsers
      }
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router;
