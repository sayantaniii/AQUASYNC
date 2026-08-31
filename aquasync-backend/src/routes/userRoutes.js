const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Any logged-in user can see their own profile
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Only operators/admins can hit this — proves RBAC is wired correctly
router.get('/admin-check', requireAuth, requireRole('operator', 'admin'), (req, res) => {
  res.json({ message: `Welcome, ${req.user.role}. You have elevated access.` });
});

module.exports = router;
