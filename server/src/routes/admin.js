const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/upload');
const a = require('../utils/asyncHandler');
const ctrl = require('../controllers/adminController');

router.use(requireAuth, requireRole('admin'));

router.get('/stats', a(ctrl.stats));
router.get('/farmhouses', a(ctrl.listFarmhouses));
router.get('/farmhouses/:id', a(ctrl.getFarmhouse));
router.patch(
  '/farmhouses/:id/visit',
  [body('visitDate').isISO8601().withMessage('Pick a valid visit date')],
  validate,
  a(ctrl.scheduleVisit)
);
router.post(
  '/farmhouses/:id/decision',
  upload.array('visitPhotos', 10),
  [
    body('decision').isIn(['approve', 'reject']).withMessage('Decision must be approve or reject'),
    body('remarks').trim().notEmpty().withMessage('Add remarks from the site visit'),
  ],
  validate,
  a(ctrl.decide)
);
router.patch('/farmhouses/:id/suspend', a(ctrl.setSuspended));
router.get('/users', a(ctrl.listUsers));
router.patch('/users/:id/block', a(ctrl.setBlocked));

module.exports = router;
