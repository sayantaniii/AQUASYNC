const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  createIncident,
  trackIncident,
  listIncidents,
  listAssignedToMe,
  assignIncident,
  updateStatus,
  getStats,
} = require('../controllers/incidentController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many reports from this IP, please try again later' },
});

router.post('/', reportLimiter, createIncident);
router.get('/track/:referenceCode', trackIncident);

router.get('/', requireAuth, requireRole('operator', 'admin'), listIncidents);
router.get('/assigned-to-me', requireAuth, requireRole('field_worker'), listAssignedToMe);
router.patch('/:id/assign', requireAuth, requireRole('operator', 'admin'), assignIncident);
router.patch('/:id/status', requireAuth, requireRole('field_worker', 'operator', 'admin'), updateStatus);
router.get('/stats', requireAuth, requireRole('admin'), getStats);

module.exports = router;