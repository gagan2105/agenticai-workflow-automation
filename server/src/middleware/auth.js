const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');
const { isUsingInMemory, getInMemoryStore } = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isUsingInMemory()) {
      const store = getInMemoryStore();
      const user = store.users.find((u) => u.id === decoded.id);
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    } else {
      const user = await User.findById(decoded.id).select('+role');
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      req.user = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

module.exports = { auth, requireAdmin };
