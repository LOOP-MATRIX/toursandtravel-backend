const Transport = require('../models/Transport');

// ✅ Add a new transport with validation
exports.addTransport = async (req, res) => {
    try {
        const { type, name, source, destination, departureTime, arrivalTime, distanceInKm, availableDays, classes } = req.body;

        if (!type || !name || !source || !destination || !departureTime || !arrivalTime || !distanceInKm || !availableDays || !classes) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const transport = new Transport(req.body);
        await transport.save();
        res.status(201).json(transport);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get all transports (with filters)
exports.getTransports = async (req, res) => {
    try {
        const { type, source, destination } = req.query;
        let filter = {};
        if (type) filter.type = type;
        if (source) filter.source = source;
        if (destination) filter.destination = destination;

        const transports = await Transport.find(filter);
        res.json(transports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get transport by ID (validate ID)
exports.getTransportById = async (req, res) => {
    try {
        if (!req.params.id) return res.status(400).json({ error: 'Transport ID is required' });

        const transport = await Transport.findById(req.params.id);
        if (!transport) return res.status(404).json({ error: 'Transport not found' });
        
        res.json(transport);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Update transport details with validation
exports.updateTransport = async (req, res) => {
    try {
        if (!req.params.id) return res.status(400).json({ error: 'Transport ID is required' });

        const transport = await Transport.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!transport) return res.status(404).json({ error: 'Transport not found' });

        res.json(transport);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Delete transport (validate ID)
exports.deleteTransport = async (req, res) => {
    try {
        if (!req.params.id) return res.status(400).json({ error: 'Transport ID is required' });

        const transport = await Transport.findByIdAndDelete(req.params.id);
        if (!transport) return res.status(404).json({ error: 'Transport not found' });

        res.json({ message: 'Transport deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
