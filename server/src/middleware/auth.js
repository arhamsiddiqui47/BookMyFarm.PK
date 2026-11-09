const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HttpError = require('../utils/httpError');

// Checks the "Authorization: Bearer <token>" header and loads the user.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Please log in');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) throw new HttpError(401, 'User no longer exists');
    if (user.isBlocked) throw new HttpError(403, 'Your account is blocked');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new HttpError(401, 'Session expired, please log in again'));
    }
    next(err);
  }
}

// Role-based access: requireRole('admin') or requireRole('owner', 'admin').
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have access to this'));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
