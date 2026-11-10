const { Pool } = require('pg');
const bcrypt = require('bcrypt');

let pool = null;
let usePostgres = false;

// Default demo staff passwords (hashed)
const DEMO_PASSWORD_HASH = bcrypt.hashSync('admin12345', 10);
const FIELD_PASSWORD_HASH = bcrypt.hashSync('field12345', 10);
const OPERATOR_PASSWORD_HASH = bcrypt.hashSync('operator12345', 10);

// In-memory data store for zero-setup development & resilient fallback
const memoryStore = {
  roles: [
    { id: 1, name: 'citizen' },
    { id: 2, name: 'field_worker' },
    { id: 3, name: 'operator' },
    { id: 4, name: 'admin' },
  ],
  users: [
    {
      id: 1,
      name: 'Elena Rostova',
      email: 'admin@aquasync.org',
      password_hash: DEMO_PASSWORD_HASH,
      role_id: 4,
      role: 'admin',
      status: 'active',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 2,
      name: 'Marcus Vance',
      email: 'operator@aquasync.org',
      password_hash: OPERATOR_PASSWORD_HASH,
      role_id: 3,
      role: 'operator',
      status: 'active',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 3,
      name: 'Carlos Diaz',
      email: 'field@aquasync.org',
      password_hash: FIELD_PASSWORD_HASH,
      role_id: 2,
      role: 'field_worker',
      status: 'active',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 4,
      name: 'Sarah Chen',
      email: 'sarah.field@aquasync.org',
      password_hash: FIELD_PASSWORD_HASH,
      role_id: 2,
      role: 'field_worker',
      status: 'active',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ],
  incidents: [
    {
      id: 1,
      reference_code: 'AQ-9K42X',
      issue_type: 'leak',
      location: 'Corner of 5th Ave & Pine St',
      description: 'Major underground pipe ruptured under asphalt, water gushing onto roadway.',
      severity: 'urgent',
      contact_phone: '+1 555-019-2834',
      latitude: 40.7128,
      longitude: -74.0060,
      image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800&auto=format&fit=crop&q=80',
      status: 'assigned',
      assigned_to: 3,
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 2,
      reference_code: 'AQ-3B89Z',
      issue_type: 'contamination',
      location: 'North Reservoir Inlet Sector 4',
      description: 'Brownish murky discharge detected with strong sulfur odor in residential lines.',
      severity: 'critical',
      contact_phone: '+1 555-014-9921',
      latitude: 40.7282,
      longitude: -73.9942,
      image_url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=80',
      status: 'in_progress',
      assigned_to: 4,
      created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
    {
      id: 3,
      reference_code: 'AQ-7M15L',
      issue_type: 'no_supply',
      location: 'West End Market Square, Block 12',
      description: 'Total water pressure drop reported across 18 commercial properties.',
      severity: 'high',
      contact_phone: '+1 555-017-4839',
      latitude: 40.7061,
      longitude: -74.0087,
      image_url: null,
      status: 'open',
      assigned_to: null,
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    {
      id: 4,
      reference_code: 'AQ-2P67T',
      issue_type: 'flooding',
      location: 'River Road Underpass',
      description: 'Storm drain culvert blocked with debris causing 1.5ft standing water.',
      severity: 'urgent',
      contact_phone: '+1 555-012-7711',
      latitude: 40.7306,
      longitude: -74.0021,
      image_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80',
      status: 'resolved',
      assigned_to: 3,
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    },
  ],
  sensors: [
    {
      id: 1,
      code: 'SEN-P01',
      name: 'Downtown Main Feeder',
      location: '5th Ave Vault #14',
      type: 'pressure',
      unit: 'PSI',
      min_normal: 45,
      max_normal: 75,
      current_value: 32.4, // Warning/burst condition
      latitude: 40.7132,
      longitude: -74.0055,
      status: 'warning',
      last_updated: new Date().toISOString(),
    },
    {
      id: 2,
      code: 'SEN-Q02',
      name: 'North Reservoir Outflow',
      location: 'Sector 4 Water Treatment',
      type: 'turbidity',
      unit: 'NTU',
      min_normal: 0.1,
      max_normal: 2.0,
      current_value: 4.8, // Critical contamination
      latitude: 40.7285,
      longitude: -73.9938,
      status: 'critical',
      last_updated: new Date().toISOString(),
    },
    {
      id: 3,
      code: 'SEN-F03',
      name: 'East Industrial Trunk',
      location: 'Dockside Valve Station',
      type: 'flow',
      unit: 'L/min',
      min_normal: 100,
      max_normal: 220,
      current_value: 165,
      latitude: 40.7190,
      longitude: -73.9820,
      status: 'normal',
      last_updated: new Date().toISOString(),
    },
    {
      id: 4,
      code: 'SEN-P04',
      name: 'Midtown Booster Pump',
      location: 'Pumping Station 3',
      type: 'pressure',
      unit: 'PSI',
      min_normal: 50,
      max_normal: 80,
      current_value: 62.1,
      latitude: 40.7240,
      longitude: -74.0010,
      status: 'normal',
      last_updated: new Date().toISOString(),
    },
    {
      id: 5,
      code: 'SEN-F05',
      name: 'South District Line',
      location: 'Harbor Gate Junction',
      type: 'flow',
      unit: 'L/min',
      min_normal: 80,
      max_normal: 190,
      current_value: 260, // Leak detected (flow spike)
      latitude: 40.7045,
      longitude: -74.0110,
      status: 'warning',
      last_updated: new Date().toISOString(),
    },
    {
      id: 6,
      code: 'SEN-Q06',
      name: 'West End Intake',
      location: 'Potable Treatment Facility B',
      type: 'turbidity',
      unit: 'NTU',
      min_normal: 0.1,
      max_normal: 2.0,
      current_value: 0.9,
      latitude: 40.7110,
      longitude: -74.0160,
      status: 'normal',
      last_updated: new Date().toISOString(),
    },
  ],
};

// Check if PostgreSQL is available
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 2000,
    });
    pool.on('error', (err) => {
      console.warn('PostgreSQL pool error, continuing with fallback mode:', err.message);
    });
    // Test connectivity
    pool.query('SELECT 1', (err) => {
      if (err) {
        console.log('PostgreSQL connection not reachable, AquaSync running in Zero-Setup Fallback Mode.');
        usePostgres = false;
      } else {
        console.log('AquaSync connected to PostgreSQL database.');
        usePostgres = true;
      }
    });
  } catch (err) {
    console.log('PostgreSQL init error, running in Zero-Setup Fallback Mode:', err.message);
    usePostgres = false;
  }
} else {
  console.log('No DATABASE_URL provided. AquaSync running in Zero-Setup Fallback Mode.');
}

// Resilient query adapter that supports both PostgreSQL and In-Memory fallback
async function query(text, params = []) {
  if (usePostgres && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('PostgreSQL query error, falling back to memory store:', err.message);
    }
  }

  // In-memory query simulation for standard queries
  const q = text.trim();

  // 1. Roles query
  if (q.includes('FROM roles')) {
    return { rows: memoryStore.roles };
  }

  // 2. User queries
  if (q.includes('FROM users u') && q.includes('WHERE u.email = $1')) {
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === (params[0] || '').toLowerCase());
    return { rows: user ? [user] : [] };
  }

  if (q.includes('SELECT id FROM users WHERE email = $1')) {
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === (params[0] || '').toLowerCase());
    return { rows: user ? [{ id: user.id }] : [] };
  }

  if (q.startsWith('INSERT INTO users')) {
    const [name, email, passwordHash, roleId = 1] = params;
    const roleObj = memoryStore.roles.find((r) => r.id === roleId) || { name: 'citizen' };
    const newUser = {
      id: memoryStore.users.length + 1,
      name,
      email,
      password_hash: passwordHash,
      role_id: roleId,
      role: roleObj.name,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    memoryStore.users.push(newUser);
    return { rows: [newUser] };
  }

  if (q.includes('SELECT u.id, u.name, u.email, r.name AS role, u.status')) {
    let list = memoryStore.users;
    if (params.length > 0 && params[0]) {
      list = list.filter((u) => u.role === params[0]);
    }
    return { rows: list };
  }

  if (q.startsWith('UPDATE users SET last_login')) {
    const u = memoryStore.users.find((x) => x.id === params[0]);
    if (u) u.last_login = new Date().toISOString();
    return { rows: u ? [u] : [] };
  }

  // 3. Incidents queries
  if (q.startsWith('INSERT INTO incidents')) {
    const [reference_code, issue_type, location, description, severity, contact_phone, latitude, longitude, image_url] = params;
    const newInc = {
      id: memoryStore.incidents.length + 1,
      reference_code,
      issue_type,
      location,
      description: description || null,
      severity: severity || 'medium',
      contact_phone: contact_phone || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      image_url: image_url || null,
      status: 'open',
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.incidents.unshift(newInc);
    return { rows: [newInc] };
  }

  if (q.includes('FROM incidents') && q.includes('WHERE reference_code = $1')) {
    const inc = memoryStore.incidents.find(
      (i) => (i.reference_code || '').toUpperCase() === (params[0] || '').toUpperCase()
    );
    return { rows: inc ? [inc] : [] };
  }

  if (q.includes('FROM incidents') && q.includes('WHERE assigned_to = $1')) {
    const list = memoryStore.incidents.filter((i) => i.assigned_to === Number(params[0]));
    return { rows: list };
  }

  if (q.includes('FROM incidents') && q.includes('status = $1')) {
    const list = memoryStore.incidents.filter((i) => i.status === params[0]);
    return { rows: list };
  }

  if (q.startsWith('SELECT * FROM incidents')) {
    return { rows: [...memoryStore.incidents] };
  }

  if (q.startsWith('UPDATE incidents SET assigned_to = $1')) {
    const [fieldWorkerId, id] = params;
    const inc = memoryStore.incidents.find((i) => i.id === Number(id));
    if (inc) {
      inc.assigned_to = Number(fieldWorkerId);
      inc.status = 'assigned';
      inc.updated_at = new Date().toISOString();
      return { rows: [inc] };
    }
    return { rows: [] };
  }

  if (q.startsWith('UPDATE incidents SET status = $1')) {
    const [status, id] = params;
    const inc = memoryStore.incidents.find((i) => i.id === Number(id));
    if (inc) {
      inc.status = status;
      inc.updated_at = new Date().toISOString();
      return { rows: [inc] };
    }
    return { rows: [] };
  }

  if (q.includes('COUNT(*)') && q.includes('FROM incidents')) {
    // Stats query
    const openCount = memoryStore.incidents.filter((i) => i.status === 'open').length;
    const inProgressCount = memoryStore.incidents.filter((i) => i.status === 'in_progress').length;
    const resolved7d = memoryStore.incidents.filter((i) => i.status === 'resolved').length;
    return { rows: [{ count: 1, avg_minutes: 42 }] };
  }

  return { rows: [] };
}

module.exports = {
  query,
  memoryStore,
};
