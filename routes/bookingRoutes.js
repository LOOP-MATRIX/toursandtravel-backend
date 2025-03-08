const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Create a new booking
router.post('/bookings', bookingController.createBooking);

// Cancel a booking
router.post('/bookings/:bookingId/cancel', bookingController.cancelBooking);

// Get user bookings
router.get('/users/:userId/bookings', bookingController.getUserBookings);
router.get('/all', bookingController.getAllBookings);
router.get('/:transportId',bookingController.getTransportBookings)

module.exports = router;