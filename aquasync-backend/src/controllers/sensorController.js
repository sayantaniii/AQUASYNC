const { memoryStore } = require('../config/db');
const { generateReferenceCode } = require('../utils/referenceCode');
const { normalizeIncident } = require('./incidentController');

// Simulates slight organic fluctuations in normal sensor readings
function getLiveSensors() {
  return memoryStore.sensors.map((sensor) => {
    // Add minor realistic jitter (+/- 2%)
    const jitter = (Math.random() - 0.5) * 0.04 * sensor.current_value;
    const value = Math.max(0, +(sensor.current_value + jitter).toFixed(1));

    let status = 'normal';
    if (value < sensor.min_normal || value > sensor.max_normal) {
      const deviation = Math.abs(value - (sensor.min_normal + sensor.max_normal) / 2);
      const span = sensor.max_normal - sensor.min_normal;
      status = deviation > span ? 'critical' : 'warning';
    }

    return {
      ...sensor,
      current_value: value,
      status: sensor.status === 'critical' ? 'critical' : status,
      last_updated: new Date().toISOString(),
    };
  });
}

async function listSensors(req, res, next) {
  try {
    const live = getLiveSensors();
    res.json(live);
  } catch (err) {
    next(err);
  }
}

async function simulateAnomaly(req, res, next) {
  try {
    const { sensorId = 1, type = 'burst' } = req.body;

    const sensor = memoryStore.sensors.find((s) => s.id === Number(sensorId)) || memoryStore.sensors[0];

    if (type === 'burst' || sensor.type === 'pressure') {
      sensor.current_value = 18.5; // Severe pressure drop below safe 45 PSI
      sensor.status = 'critical';
    } else if (type === 'contamination' || sensor.type === 'turbidity') {
      sensor.current_value = 6.2; // Severe turbidity spike above safe 2.0 NTU
      sensor.status = 'critical';
    } else {
      sensor.current_value = 310; // Massive flow rate spike
      sensor.status = 'warning';
    }

    sensor.last_updated = new Date().toISOString();

    // Automatically create an incident in the system triggered by IoT telemetry!
    const issueType = sensor.type === 'pressure' ? 'leak' : sensor.type === 'turbidity' ? 'contamination' : 'flooding';
    const refCode = generateReferenceCode();

    const automatedIncident = {
      id: memoryStore.incidents.length + 1,
      reference_code: refCode,
      issue_type: issueType,
      location: `${sensor.name} - ${sensor.location}`,
      description: `[IoT ANOMALY AUTO-ALERT] Sensor ${sensor.code} detected critical telemetry out of range (${sensor.current_value} ${sensor.unit}). Automatic crew dispatch recommended.`,
      severity: 'critical',
      contact_phone: 'IoT Automated Alert',
      latitude: sensor.latitude,
      longitude: sensor.longitude,
      image_url: null,
      status: 'open',
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryStore.incidents.unshift(automatedIncident);
    const normalized = normalizeIncident(automatedIncident);

    // Broadcast to real-time subscribers
    if (req.app.get('broadcastIncident')) {
      req.app.get('broadcastIncident')('created', normalized);
      req.app.get('broadcastIncident')('sensor_anomaly', { sensor, incident: normalized });
    }

    res.json({
      message: `Anomaly triggered on ${sensor.name}`,
      sensor,
      incident: normalized,
    });
  } catch (err) {
    next(err);
  }
}

async function resetSensors(req, res, next) {
  try {
    memoryStore.sensors[0].current_value = 58.0;
    memoryStore.sensors[0].status = 'normal';

    memoryStore.sensors[1].current_value = 0.8;
    memoryStore.sensors[1].status = 'normal';

    memoryStore.sensors[2].current_value = 150.0;
    memoryStore.sensors[2].status = 'normal';

    memoryStore.sensors[3].current_value = 64.0;
    memoryStore.sensors[3].status = 'normal';

    memoryStore.sensors[4].current_value = 135.0;
    memoryStore.sensors[4].status = 'normal';

    memoryStore.sensors[5].current_value = 0.7;
    memoryStore.sensors[5].status = 'normal';

    res.json({ message: 'Sensors recalibrated to nominal range', sensors: memoryStore.sensors });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSensors,
  simulateAnomaly,
  resetSensors,
};
