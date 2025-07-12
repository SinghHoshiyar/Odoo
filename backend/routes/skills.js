const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect: auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/skills/categories
// @desc    Get all skill categories from existing users
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    // Aggregate all unique skills from both offered and wanted skills
    const skillsAggregation = await User.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          allSkills: {
            $concatArrays: [
              { $map: { input: '$skillsOffered', as: 'skill', in: '$$skill.name' } },
              { $map: { input: '$skillsWanted', as: 'skill', in: '$$skill.name' } }
            ]
          }
        }
      },
      { $unwind: '$allSkills' },
      {
        $group: {
          _id: { $toLower: '$allSkills' },
          count: { $sum: 1 },
          originalName: { $first: '$allSkills' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 100 }
    ]);

    // Categorize skills into general categories
    const categories = {
      'Technology': [],
      'Creative Arts': [],
      'Languages': [],
      'Business': [],
      'Health & Fitness': [],
      'Education': [],
      'Crafts & Hobbies': [],
      'Other': []
    };

    // Define keywords for categorization
    const categoryKeywords = {
      'Technology': ['programming', 'coding', 'web', 'app', 'software', 'development', 'javascript', 'python', 'java', 'react', 'node', 'database', 'ai', 'machine learning', 'data', 'cyber', 'tech', 'computer', 'digital', 'html', 'css', 'php', 'sql', 'cloud', 'aws', 'docker'],
      'Creative Arts': ['design', 'drawing', 'painting', 'photography', 'music', 'singing', 'art', 'creative', 'graphic', 'illustration', 'video', 'editing', 'animation', 'ui', 'ux', 'photoshop', 'adobe', 'sketch'],
      'Languages': ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'arabic', 'italian', 'portuguese', 'russian', 'hindi', 'language', 'translation', 'interpreter'],
      'Business': ['marketing', 'sales', 'management', 'finance', 'accounting', 'business', 'entrepreneurship', 'leadership', 'strategy', 'consulting', 'project management', 'excel', 'powerpoint', 'presentation'],
      'Health & Fitness': ['fitness', 'yoga', 'meditation', 'nutrition', 'health', 'exercise', 'workout', 'running', 'sports', 'wellness', 'therapy', 'massage', 'pilates', 'crossfit'],
      'Education': ['teaching', 'tutoring', 'education', 'training', 'math', 'mathematics', 'science', 'physics', 'chemistry', 'biology', 'history', 'writing', 'research', 'academic'],
      'Crafts & Hobbies': ['cooking', 'baking', 'gardening', 'knitting', 'sewing', 'woodworking', 'crafts', 'diy', 'hobby', 'handmade', 'pottery', 'jewelry', 'repair', 'maintenance']
    };

    // Categorize each skill
    skillsAggregation.forEach(skill => {
      const skillName = skill.originalName.toLowerCase();
      let categorized = false;

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => skillName.includes(keyword))) {
          categories[category].push({
            name: skill.originalName,
            count: skill.count
          });
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        categories['Other'].push({
          name: skill.originalName,
          count: skill.count
        });
      }
    });

    // Sort skills within each category by count
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => b.count - a.count);
    });

    res.json(categories);
  } catch (error) {
    console.error('Get skills categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/skills/search
// @desc    Search for skills
// @access  Public
router.get('/search', [
  query('q').trim().isLength({ min: 1 }).withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { q: searchQuery, limit = 20 } = req.query;
    
    // Search in both offered and wanted skills
    const skillsAggregation = await User.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          allSkills: {
            $concatArrays: [
              { $map: { input: '$skillsOffered', as: 'skill', in: '$$skill.name' } },
              { $map: { input: '$skillsWanted', as: 'skill', in: '$$skill.name' } }
            ]
          }
        }
      },
      { $unwind: '$allSkills' },
      {
        $match: {
          allSkills: { $regex: searchQuery, $options: 'i' }
        }
      },
      {
        $group: {
          _id: { $toLower: '$allSkills' },
          count: { $sum: 1 },
          originalName: { $first: '$allSkills' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const skills = skillsAggregation.map(skill => ({
      name: skill.originalName,
      count: skill.count
    }));

    res.json({ skills, total: skills.length });
  } catch (error) {
    console.error('Search skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/skills/popular
// @desc    Get most popular skills
// @access  Public
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const popularSkills = await User.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$skillsOffered' },
      {
        $group: {
          _id: { $toLower: '$skillsOffered.name' },
          count: { $sum: 1 },
          originalName: { $first: '$skillsOffered.name' },
          levels: { $push: '$skillsOffered.level' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const skills = popularSkills.map(skill => ({
      name: skill.originalName,
      count: skill.count,
      popularLevel: skill.levels.reduce((acc, level) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {})
    }));

    res.json({ skills, total: skills.length });
  } catch (error) {
    console.error('Get popular skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/skills/trending
// @desc    Get trending skills (skills added recently)
// @access  Public
router.get('/trending', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90')
], async (req, res) => {
  try {
    const { limit = 20, days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const trendingSkills = await User.aggregate([
      { 
        $match: { 
          isActive: true,
          createdAt: { $gte: cutoffDate }
        }
      },
      { $unwind: '$skillsOffered' },
      {
        $group: {
          _id: { $toLower: '$skillsOffered.name' },
          count: { $sum: 1 },
          originalName: { $first: '$skillsOffered.name' },
          recentUsers: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const skills = trendingSkills.map(skill => ({
      name: skill.originalName,
      count: skill.count,
      recentUsers: skill.recentUsers
    }));

    res.json({ 
      skills, 
      total: skills.length,
      period: `Last ${days} days`
    });
  } catch (error) {
    console.error('Get trending skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/skills/recommendations
// @desc    Get skill recommendations based on user's current skills
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userOfferedSkills = currentUser.skillsOffered.map(skill => skill.name.toLowerCase());
    const userWantedSkills = currentUser.skillsWanted.map(skill => skill.name.toLowerCase());

    // Find users with similar skills to get recommendations
    const similarUsers = await User.find({
      _id: { $ne: req.user.id },
      isActive: true,
      'skillsOffered.name': { 
        $in: userOfferedSkills.map(skill => new RegExp(skill, 'i'))
      }
    }).select('skillsOffered skillsWanted');

    // Collect skills from similar users
    const recommendedSkills = new Map();

    similarUsers.forEach(user => {
      user.skillsOffered.forEach(skill => {
        const skillNameLower = skill.name.toLowerCase();
        if (!userOfferedSkills.includes(skillNameLower) && 
            !userWantedSkills.includes(skillNameLower)) {
          if (recommendedSkills.has(skillNameLower)) {
            recommendedSkills.set(skillNameLower, {
              ...recommendedSkills.get(skillNameLower),
              count: recommendedSkills.get(skillNameLower).count + 1
            });
          } else {
            recommendedSkills.set(skillNameLower, {
              name: skill.name,
              count: 1,
              level: skill.level
            });
          }
        }
      });

      user.skillsWanted.forEach(skill => {
        const skillNameLower = skill.name.toLowerCase();
        if (!userOfferedSkills.includes(skillNameLower) && 
            !userWantedSkills.includes(skillNameLower)) {
          if (recommendedSkills.has(skillNameLower)) {
            recommendedSkills.set(skillNameLower, {
              ...recommendedSkills.get(skillNameLower),
              count: recommendedSkills.get(skillNameLower).count + 0.5 // Weight wanted skills less
            });
          } else {
            recommendedSkills.set(skillNameLower, {
              name: skill.name,
              count: 0.5,
              priority: skill.priority
            });
          }
        }
      });
    });

    // Convert to array and sort by count
    const recommendations = Array.from(recommendedSkills.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    res.json({ 
      recommendations,
      total: recommendations.length,
      basedOn: userOfferedSkills.length
    });
  } catch (error) {
    console.error('Get skill recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/skills/stats
// @desc    Get platform skill statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalOfferedSkills: { $sum: { $size: '$skillsOffered' } },
          totalWantedSkills: { $sum: { $size: '$skillsWanted' } },
          avgOfferedSkills: { $avg: { $size: '$skillsOffered' } },
          avgWantedSkills: { $avg: { $size: '$skillsWanted' } }
        }
      }
    ]);

    // Get unique skills count
    const uniqueSkillsAggregation = await User.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          allSkills: {
            $concatArrays: [
              { $map: { input: '$skillsOffered', as: 'skill', in: '$$skill.name' } },
              { $map: { input: '$skillsWanted', as: 'skill', in: '$$skill.name' } }
            ]
          }
        }
      },
      { $unwind: '$allSkills' },
      {
        $group: {
          _id: { $toLower: '$allSkills' }
        }
      },
      {
        $group: {
          _id: null,
          uniqueSkills: { $sum: 1 }
        }
      }
    ]);

    const platformStats = {
      ...stats[0],
      uniqueSkills: uniqueSkillsAggregation[0]?.uniqueSkills || 0
    };

    delete platformStats._id;

    res.json(platformStats);
  } catch (error) {
    console.error('Get skills stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
