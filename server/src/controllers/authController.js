const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HttpError = require('../utils/httpError');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Anyone can sign up as a customer or an owner. Admins are created with the seed script only.
exports.register = async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  const safeRole = role === 'owner' ? 'owner' : 'customer';
  const exists = await User.findOne({ email });
  if (exists) throw new HttpError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, phone, password, role: safeRole });
  res.status(201).json({ token: signToken(user), user });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Wrong email or password');
  }
  if (user.isBlocked) throw new HttpError(403, 'Your account is blocked');
  res.json({ token: signToken(user), user });
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};
