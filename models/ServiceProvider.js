const mongoose = require('mongoose');

const serviceProviderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['airline', 'train', 'bus'], required: true },
    contactEmail: { type: String },
    contactPhone: { type: String },
    address: { type: String },
    website: { type: String },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);
