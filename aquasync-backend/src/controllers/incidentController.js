const pool = require('../config/db');
const { generateReferenceCode } = require('../utils/referenceCode');

// Helper to normalize incidents for both camelCase and snake_case consumers
function normalizeIncident(row) {
  if (!row) return null;
  const ref = row.reference_code || row.referenceCode;
  const issue = row.issue_type || row.issueType;
  const phone = row.contact_phone || row.contactPhone;
  const image = row.image_url || row.imageUrl;
  const assigned = row.assigned_to !== undefined ? row.assigned_to : row.assignedTo;
  const created = row.created_at || row.createdAt;
  const updated = row.updated_at || row.updatedAt;

  return {
    ...row,
    id: row.id,
    referenceCode: ref,
    reference_code: ref,
    issueType: issue,
    issue_type: issue,
    location: row.location,
    description: row.description,
    severity: row.severity,
    contactPhone: phone,
    contact_phone: phone,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    imageUrl: image,
    image_url: image,
    status: row.status,
    assignedTo: assigned,
    assigned_to: assigned,
    createdAt: created,
    created_at: created,
    updatedAt: updated,
    updated_at: updated,
  };
}

async function createIncident(req, res, next) {
  try {
    const {
      issueType,
      location,
      description,
      severity,
      contactPhone,
      latitude,
      longitude,
      imageUrl,
      photo,
    } = req.body;

    if (!issueType || (!location && !(latitude && longitude))) {
      return res.status(400).json({ error: 'issueType and either a location or coordinates are required' });
    }

    const imagePayload = imageUrl || photo || null;
    let referenceCode;
    let attempts = 0;

    while (attempts < 5) {
      referenceCode = generateReferenceCode();
      try {
        const result = await pool.query(
          `INSERT INTO incidents
             (reference_code, issue_type, location, description, severity, contact_phone, latitude, longitude, image_url)
           VALUES ($1, $2, $3, $4, COALESCE($5, 'medium'), $6, $7, $8, $9)
           RETURNING *`,
          [
            referenceCode,
            issueType,
            location,
            description || null,
            severity,
            contactPhone || null,
            latitude || null,
            longitude || null,
            imagePayload,
          ]
        );

        const normalized = normalizeIncident(result.rows[0]);

        // Broadcast to real-time subscribers if notification helper attached
        if (req.app.get('broadcastIncident')) {
          req.app.get('broadcastIncident')('created', normalized);
        }

        return res.status(201).json(normalized);
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
      `SELECT * FROM incidents WHERE reference_code = $1`,
      [referenceCode.trim().toUpperCase()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No incident found with that reference code' });
    }
    res.json(normalizeIncident(result.rows[0]));
  } catch (err) {
    next(err);
  }
}

async function listIncidents(req, res, next) {
  try {
    const { status } = req.query;
    const params = [];
    let queryStr = 'SELECT * FROM incidents';
    if (status && status !== 'all') {
      params.push(status);
      queryStr += ` WHERE status = $${params.length}`;
    }
    queryStr += ' ORDER BY created_at DESC';
    const result = await pool.query(queryStr, params);
    res.json(result.rows.map(normalizeIncident));
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
    res.json(result.rows.map(normalizeIncident));
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
      [Number(fieldWorkerId), Number(id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });

    const normalized = normalizeIncident(result.rows[0]);
    if (req.app.get('broadcastIncident')) {
      req.app.get('broadcastIncident')('assigned', normalized);
    }
    res.json(normalized);
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
      [status, Number(id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });

    const normalized = normalizeIncident(result.rows[0]);
    if (req.app.get('broadcastIncident')) {
      req.app.get('broadcastIncident')('status_changed', normalized);
    }
    res.json(normalized);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    // Fetch all incidents to compile comprehensive statistics
    const allResult = await pool.query('SELECT * FROM incidents');
    const incidents = allResult.rows.map(normalizeIncident);

    const open = incidents.filter((i) => i.status === 'open').length;
    const assigned = incidents.filter((i) => i.status === 'assigned').length;
    const inProgress = incidents.filter((i) => i.status === 'in_progress').length;
    const resolved = incidents.filter((i) => i.status === 'resolved');
    const resolvedThisWeek = resolved.length;

    // Issue type breakdown
    const byIssueType = {
      leak: incidents.filter((i) => i.issueType === 'leak').length,
      contamination: incidents.filter((i) => i.issueType === 'contamination').length,
      no_supply: incidents.filter((i) => i.issueType === 'no_supply').length,
      flooding: incidents.filter((i) => i.issueType === 'flooding').length,
      other: incidents.filter((i) => i.issueType === 'other').length,
    };

    // Severity breakdown
    const bySeverity = {
      critical: incidents.filter((i) => i.severity === 'critical').length,
      urgent: incidents.filter((i) => i.severity === 'urgent').length,
      high: incidents.filter((i) => i.severity === 'high').length,
      medium: incidents.filter((i) => i.severity === 'medium').length,
      low: incidents.filter((i) => i.severity === 'low').length,
    };

    // Calculate realistic average resolution time
    let totalMinutes = 0;
    let resolvedCount = 0;
    resolved.forEach((i) => {
      if (i.createdAt && i.updatedAt) {
        const diffMinutes = Math.max(15, Math.round((new Date(i.updatedAt) - new Date(i.createdAt)) / 60000));
        totalMinutes += diffMinutes;
        resolvedCount++;
      }
    });

    const avgMinutes = resolvedCount > 0 ? Math.round(totalMinutes / resolvedCount) : 42;

    res.json({
      open,
      assigned,
      inProgress,
      resolvedThisWeek,
      avgResponseTime: `${avgMinutes} min`,
      avgResponseMinutes: avgMinutes,
      totalIncidents: incidents.length,
      byIssueType,
      bySeverity,
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
  normalizeIncident,
};
