const express = require('express');
const { body, validationResult, param } = require('express-validator');
const User = require('../models/User');
const Swap = require('../models/Swap');
const { protect: auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile with dashboard data
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user swaps stats
    const swapsStats = await Swap.aggregate([
      {
        $match: {
          $or: [
            { requester: user._id },
            { provider: user._id }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalSwaps: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]);

    const skillsCount = user.skillsOffered.length;

    const dashboardData = {
      swapsStats: swapsStats[0] || {
        totalSwaps: 0,
        pending: 0,
        accepted: 0,
        completed: 0,
        rejected: 0,
        cancelled: 0
      },
      skillsCount
    };

    res.json({ user, dashboardData });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Name must be between 1-50 characters'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('availability.weekdays').optional().isBoolean(),
  body('availability.weekends').optional().isBoolean(),
  body('availability.evenings').optional().isBoolean(),
  body('availability.mornings').optional().isBoolean(),
  body('availability.afternoons').optional().isBoolean(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, location, availability, isPublic } = req.body;
    
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (location !== undefined) updateFields.location = location;
    if (availability !== undefined) updateFields.availability = availability;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/profile/photo
// @desc    Upload profile photo
// @access  Private
router.post('/profile/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile photo if exists
    if (user.profilePhoto) {
      try {
        await fs.unlink(user.profilePhoto);
      } catch (error) {
        console.warn('Could not delete old profile photo:', error.message);
      }
    }

    user.profilePhoto = req.file.path;
    await user.save();

    res.json({ 
      message: 'Profile photo uploaded successfully',
      profilePhoto: user.profilePhoto 
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/skills/offered
// @desc    Add offered skill
// @access  Private
router.post('/skills/offered', [
  auth,
  body('name').trim().isLength({ min: 1 }).withMessage('Skill name is required'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Invalid skill level')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, level } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if skill already exists
    const existingSkill = user.skillsOffered.find(skill => 
      skill.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingSkill) {
      return res.status(400).json({ message: 'Skill already exists in your offered skills' });
    }

    user.skillsOffered.push({
      name: name.trim(),
      description: description?.trim() || '',
      level: level || 'Intermediate'
    });

    await user.save();
    res.status(201).json({ 
      message: 'Skill added successfully',
      skillsOffered: user.skillsOffered 
    });
  } catch (error) {
    console.error('Add offered skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/skills/wanted
// @desc    Add wanted skill
// @access  Private
router.post('/skills/wanted', [
  auth,
  body('name').trim().isLength({ min: 1 }).withMessage('Skill name is required'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority level')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, priority } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if skill already exists
    const existingSkill = user.skillsWanted.find(skill => 
      skill.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingSkill) {
      return res.status(400).json({ message: 'Skill already exists in your wanted skills' });
    }

    user.skillsWanted.push({
      name: name.trim(),
      description: description?.trim() || '',
      priority: priority || 'Medium'
    });

    await user.save();
    res.status(201).json({ 
      message: 'Skill added successfully',
      skillsWanted: user.skillsWanted 
    });
  } catch (error) {
    console.error('Add wanted skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/skills/offered/:skillId
// @desc    Remove offered skill
// @access  Private
router.delete('/skills/offered/:skillId', [
  auth,
  param('skillId').isMongoId().withMessage('Invalid skill ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skillIndex = user.skillsOffered.findIndex(skill => 
      skill._id.toString() === req.params.skillId
    );

    if (skillIndex === -1) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    user.skillsOffered.splice(skillIndex, 1);
    await user.save();

    res.json({ 
      message: 'Skill removed successfully',
      skillsOffered: user.skillsOffered 
    });
  } catch (error) {
    console.error('Remove offered skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/skills/wanted/:skillId
// @desc    Remove wanted skill
// @access  Private
router.delete('/skills/wanted/:skillId', [
  auth,
  param('skillId').isMongoId().withMessage('Invalid skill ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skillIndex = user.skillsWanted.findIndex(skill => 
      skill._id.toString() === req.params.skillId
    );

    if (skillIndex === -1) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    user.skillsWanted.splice(skillIndex, 1);
    await user.save();

    res.json({ 
      message: 'Skill removed successfully',
      skillsWanted: user.skillsWanted 
    });
  } catch (error) {
    console.error('Remove wanted skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by skill
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { skill, location, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query for user search
    const query = {
      isActive: true,
      isPublic: true
    };

    // Filter by skill if provided
    if (skill) {
      query['skillsOffered.name'] = new RegExp(skill, 'i');
    }

    // Filter by location if provided
    if (location) {
      query.location = new RegExp(location, 'i');
    }

    const users = await User.find(query)
      .select('-password -email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1, joinedAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/discover
// @desc    Discover users for skill matching
// @access  Private
router.get('/discover', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { skill, location, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query for user discovery
    const query = {
      _id: { $ne: req.user.id }, // Exclude current user
      isActive: true,
      isPublic: true
    };

    // Filter by location if provided
    if (location) {
      query.location = new RegExp(location, 'i');
    }

    // Filter by skill if provided
    if (skill) {
      query['skillsOffered.name'] = new RegExp(skill, 'i');
    }

    const users = await User.find(query)
      .select('-password -email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1, joinedAt: -1 });

    // Calculate skill match scores for each user
    const usersWithMatchScore = users.map(user => {
      let matchScore = 0;
      let matchedSkills = [];

      // Check how many of current user's wanted skills match with this user's offered skills
      currentUser.skillsWanted.forEach(wantedSkill => {
        const matchingOfferedSkill = user.skillsOffered.find(offeredSkill => 
          offeredSkill.name.toLowerCase().includes(wantedSkill.name.toLowerCase()) ||
          wantedSkill.name.toLowerCase().includes(offeredSkill.name.toLowerCase())
        );
        
        if (matchingOfferedSkill) {
          matchScore += wantedSkill.priority === 'High' ? 3 : wantedSkill.priority === 'Medium' ? 2 : 1;
          matchedSkills.push({
            wanted: wantedSkill.name,
            offered: matchingOfferedSkill.name,
            level: matchingOfferedSkill.level
          });
        }
      });

      return {
        ...user.toObject(),
        matchScore,
        matchedSkills
      };
    });

    // Sort by match score
    usersWithMatchScore.sort((a, b) => b.matchScore - a.matchScore);

    const total = await User.countDocuments(query);

    res.json({
      users: usersWithMatchScore,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Discover users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user by ID
// @access  Private
router.get('/:userId', [
  auth,
  param('userId').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.params.userId)
      .select('-password -email')
      .populate('skillsOffered')
      .populate('skillsWanted');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isPublic && user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'This profile is private' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
