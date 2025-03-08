const mongoose = require('mongoose');

// Define Booking Schema with enhanced fields
const bookingSchema = new mongoose.Schema({
    transportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transport',
        required: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    seats: [{
        seatNumber: { type: String, required: true },
        classType: { type: String, required: true },
        price: { type: Number, required: true }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    departureDateTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled'],
        default: 'confirmed',
        index: true
    },
    cancelledAt: {
        type: Date
    },
    refundAmount: {
        type: Number
    },
    refundPercentage: {
        type: Number
    }
});

// Add indexes for better query performance
bookingSchema.index({ transportId: 1, status: 1 });
bookingSchema.index({ departureDateTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);