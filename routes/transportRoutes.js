const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');

// ✅ Add a new transport
router.post('/add', transportController.addTransport);

// ✅ Get all transports (with optional filters)
router.get('/all', transportController.getTransports);

// ✅ Get transport by ID
router.get('/:id', transportController.getTransportById);

// ✅ Update transport details
router.put('/:id', transportController.updateTransport);

// ✅ Delete transport
router.delete('/:id', transportController.deleteTransport);

module.exports = router;
