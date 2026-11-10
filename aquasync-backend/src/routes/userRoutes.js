const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Any logged-in user can see their own profile
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// List users (Operators can fetch field_workers; Admins can fetch all staff)
router.get('/', requireAuth, requireRole('operator', 'admin'), async (req, res, next) => {
  try {
    const { role } = req.query;
    let result;

    if (role) {
      result = await pool.query(
        `SELECT u.id, u.name, u.email, r.name AS role, u.status, u.created_at
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE r.name = $1
         ORDER BY u.name ASC`,
        [role]
      );
    } else {
      result = await pool.query(
        `SELECT u.id, u.name, u.email, r.name AS role, u.status, u.created_at
         FROM users u
         JOIN roles r ON r.id = u.role_id
         ORDER BY u.created_at DESC`
      );
    }

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Only operators/admins can hit this — proves RBAC is wired correctly
router.get('/admin-check', requireAuth, requireRole('operator', 'admin'), (req, res) => {
  res.json({ message: `Welcome, ${req.user.role}. You have elevated access.` });
});

module.exports = router;
