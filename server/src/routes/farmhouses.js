const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/upload');
const a = require('../utils/asyncHandler');
const ctrl = require('../controllers/farmhouseController');

// Public
router.get('/', a(ctrl.listPublic));
router.get('/compare', a(ctrl.compare));
router.get('/areas', a(async (req, res) => {
  const Farmhouse = require('../models/Farmhouse');
  res.json({ areas: (await Farmhouse.distinct('area', { status: 'approved' })).sort() });
}));

// Owner (these must come before "/:id")
const owner = [requireAuth, requireRole('owner')];
router.get('/mine/list', owner, a(ctrl.listMine));
router.get('/mine/:id', owner, a(ctrl.getMine));
router.post(
  '/',
  owner,
  upload.array('photos', 10),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('area').trim().notEmpty().withMessage('Area is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  validate,
  a(ctrl.create)
);
router.patch('/:id', owner, upload.array('photos', 10), a(ctrl.update));
router.delete('/:id', owner, a(ctrl.remove));

router.get('/:id/availability', a(ctrl.availability));
router.get('/:id', a(ctrl.getPublic));

module.exports = router;
