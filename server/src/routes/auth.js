const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const a = require('../utils/asyncHandler');
const ctrl = require('../controllers/authController');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().matches(/^(\+92|0)3\d{9}$/).withMessage('Enter a valid Pakistani mobile number'),
    body('role').optional().isIn(['customer', 'owner']),
  ],
  validate,
  a(ctrl.register)
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  a(ctrl.login)
);

router.get('/me', requireAuth, a(ctrl.me));

module.exports = router;
