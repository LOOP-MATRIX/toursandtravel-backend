const express = require('express');
const router = express.Router();
const auth  = require('../middleware/authMiddleware')
const {
    addServiceProvider,
    getAllServiceProviders,
    getServiceProviderById,
    updateServiceProvider,
    deleteServiceProvider
} = require('../controllers/serviceProviderController');

// Add a new Service Provider
router.post('/add' , addServiceProvider);

// Get all Service Providers
router.get('/', getAllServiceProviders);

// Get a specific Service Provider by ID
router.get('/:id', getServiceProviderById);

// Update a Service Provider by ID
router.put('/update/:id', updateServiceProvider);

// Delete a Service Provider by ID
router.delete('/delete/:id', deleteServiceProvider);

module.exports = router;
