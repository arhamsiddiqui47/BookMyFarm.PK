// Placeholder role-protected routes. Each dashboard fills in during later weeks.
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/customer', requireAuth, requireRole('customer'), (req, res) =>
  res.json({ role: 'customer', message: `Welcome ${req.user.name}` })
);
router.get('/owner', requireAuth, requireRole('owner'), (req, res) =>
  res.json({ role: 'owner', message: `Welcome ${req.user.name}` })
);
router.get('/admin', requireAuth, requireRole('admin'), (req, res) =>
  res.json({ role: 'admin', message: `Welcome ${req.user.name}` })
);

module.exports = router;
