const User = require('../models/User');
const { protect: auth } = require('./auth');

// Combined middleware to check auth and admin status
const isAdmin = [auth, async (req, res, next) => {
  try {
    // Check if user is authenticated (should be called after auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get user details to check admin status
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is not active' });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}];

module.exports = { isAdmin };
