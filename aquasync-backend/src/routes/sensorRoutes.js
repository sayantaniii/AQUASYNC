const express = require('express');
const { listSensors, simulateAnomaly, resetSensors } = require('../controllers/sensorController');

const router = express.Router();

router.get('/', listSensors);
router.post('/simulate', simulateAnomaly);
router.post('/reset', resetSensors);

module.exports = router;
