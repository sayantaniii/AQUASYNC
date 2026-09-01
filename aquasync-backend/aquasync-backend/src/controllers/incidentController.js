const pool = require('../config/db');
const { generateReferenceCode } = require('../utils/referenceCode');

async function createIncident(req, res, next) {
  try {
    const { issueType, location, description, severity, contactPhone, latitude, longitude } = req.body;

    if (!issueType || !location) {
      return res.status(400).json({ error: 'issueType and location are required' });
    }

    let referenceCode;
    let attempts = 0;

    while (attempts < 3) {
      referenceCode = generateReferenceCode();
      try {
        const result = await pool.query(
          `INSERT INTO incidents
             (reference_code, issue_type, location, description, severity, contact_phone, latitude, longitude)
           VALUES ($1, $2, $3, $4, COALESCE($5, 'medium'), $6, $7, $8)
           RETURNING *`,
          [referenceCode, issueType, location, description || null, severity, contactPhone || null, latitude || null, longitude || null]
        );
        return res.status(201).json(result.rows[0]);
      } catch (err) {
        if (err.code === '23505') {
          attempts++;
          continue;
        }
        throw err;
      }
    }
    return res.status(500).json({ error: 'Could not generate a unique reference code, try again' });
  } catch (err) {
    next(err);
  }
}

async function trackIncident(req, res, next) {
  try {
    const { referenceCode } = req.params;
    const result = await pool.query(
      `SELECT reference_code, issue_type, location, severity, status, created_at, updated_at
       FROM incidents WHERE reference_code = $1`,
      [referenceCode.toUpperCase()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No incident found with that reference code' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listIncidents(req, res, next) {
  try {
    const { status } = req.query;
    const params = [];
    let query = 'SELECT * FROM incidents';
    if (status) {
      params.push(status);
      query += ` WHERE status = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function listAssignedToMe(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT * FROM incidents WHERE assigned_to = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function assignIncident(req, res, next) {
  try {
    const { id } = req.params;
    const { fieldWorkerId } = req.body;
    if (!fieldWorkerId) return res.status(400).json({ error: 'fieldWorkerId is required' });

    const result = await pool.query(
      `UPDATE incidents SET assigned_to = $1, status = 'assigned', updated_at = now()
       WHERE id = $2 RETURNING *`,
      [fieldWorkerId, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['open', 'assigned', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE incidents SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const [open, inProgress, resolvedThisWeek, avgResponse] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM incidents WHERE status = 'open'`),
      pool.query(`SELECT COUNT(*) FROM incidents WHERE status = 'in_progress'`),
      pool.query(`SELECT COUNT(*) FROM incidents WHERE status = 'resolved' AND updated_at >= now() - interval '7 days'`),
      pool.query(`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) AS avg_minutes
                  FROM incidents WHERE status = 'resolved'`),
    ]);

    res.json({
      open: Number(open.rows[0].count),
      inProgress: Number(inProgress.rows[0].count),
      resolvedThisWeek: Number(resolvedThisWeek.rows[0].count),
      avgResponseTime: avgResponse.rows[0].avg_minutes
        ? Math.round(avgResponse.rows[0].avg_minutes)
        : null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createIncident,
  trackIncident,
  listIncidents,
  listAssignedToMe,
  assignIncident,
  updateStatus,
  getStats,
};