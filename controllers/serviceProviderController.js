const ServiceProvider = require('../models/ServiceProvider');

// Add a new Service Provider
exports.addServiceProvider = async (req, res) => {
    try {
        const { name, type, contactEmail, contactPhone, address, website, description } = req.body;
        // Optionally, check if a provider with the same name exists
        const newProvider = new ServiceProvider({ name, type, contactEmail, contactPhone, address, website, description });
        await newProvider.save();
        res.status(201).json({ message: 'Service provider added successfully', provider: newProvider });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all Service Providers
exports.getAllServiceProviders = async (req, res) => {
    try {
        const providers = await ServiceProvider.find();
        res.json(providers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a Service Provider by ID
exports.getServiceProviderById = async (req, res) => {
    try {
        const provider = await ServiceProvider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ error: 'Service provider not found' });
        }
        res.json(provider);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a Service Provider
exports.updateServiceProvider = async (req, res) => {
    try {
        const updatedProvider = await ServiceProvider.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProvider) {
            return res.status(404).json({ error: 'Service provider not found' });
        }
        res.json({ message: 'Service provider updated successfully', provider: updatedProvider });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a Service Provider
exports.deleteServiceProvider = async (req, res) => {
    try {
        const deletedProvider = await ServiceProvider.findByIdAndDelete(req.params.id);
        if (!deletedProvider) {
            return res.status(404).json({ error: 'Service provider not found' });
        }
        res.json({ message: 'Service provider deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
