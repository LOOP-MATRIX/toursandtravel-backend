const mongoose = require('mongoose');
const Transport = require('../models/Transport');
const Booking = require('../models/Booking');

// Create a new booking with improved validation
exports.createBooking = async (req, res) => {
    // Use a MongoDB session for transaction support
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { transportId, seats, userId } = req.body;

        // Validate required fields
        if (!transportId || !seats || !seats.length || !userId ) {
            return res.status(400).json({ error: 'Transport ID, seat numbers, user ID are required' });
        }


        // Find the transport with session to lock the document during transaction
        const transport = await Transport.findById(transportId).session(session);
        if (!transport) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: 'Transport not found' });
        }

        // Check if transport is available for the booking date (if provided)
        if (req.body.bookingDate) {
            const bookingDate = new Date(req.body.bookingDate);
            const day = bookingDate.toLocaleString('en-US', { weekday: 'long' });
            
            if (!transport.availableDays.includes(day)) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ 
                    error: `Transport not available on ${day}`, 
                    availableDays: transport.availableDays 
                });
            }
        }

        // Check if booking is for a future departure
        const departureDateTime = new Date(`${req.body.bookingDate || new Date().toISOString().split('T')[0]} ${transport.departureTime}`);
        if (departureDateTime < new Date()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: 'Cannot book transport for past departure times' });
        }

        // Verify all seats exist, are available, and are of the same class if specified
        const seatNumbers = Array.isArray(seats) ? seats : [seats];
        const unavailableSeats = [];
        const nonExistentSeats = [];
        const incompatibleClassSeats = [];
        const requestedClass = req.body.classType;

        for (const seatNumber of seatNumbers) {
            const seatIndex = transport.seats.findIndex(s => s.seatNumber === seatNumber);
            
            if (seatIndex === -1) {
                nonExistentSeats.push(seatNumber);
                continue;
            }
            
            const seat = transport.seats[seatIndex];
            
            if (seat.isBooked) {
                unavailableSeats.push(seatNumber);
            }
            
            // If a specific class is requested, verify seat class
            if (requestedClass && seat.classType !== requestedClass) {
                incompatibleClassSeats.push(seatNumber);
            }
        }

        // Handle validation errors
        if (nonExistentSeats.length > 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                error: 'Some seats do not exist', 
                nonExistentSeats 
            });
        }
        
        if (unavailableSeats.length > 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                error: 'Some seats are already booked', 
                unavailableSeats 
            });
        }
        
        if (incompatibleClassSeats.length > 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                error: `Some seats are not in the requested class (${requestedClass})`, 
                incompatibleClassSeats 
            });
        }

        // Calculate total price
        let totalPrice = 0;
        const bookedSeatDetails = [];
        
        for (const seatNumber of seatNumbers) {
            const seat = transport.seats.find(s => s.seatNumber === seatNumber);
            const seatClass = transport.classes.find(c => c.name === seat.classType);
            
            if (!seatClass) {
                await session.abortTransaction();
                session.endSession();
                return res.status(500).json({ 
                    error: `Class definition not found for seat ${seatNumber} with class ${seat.classType}` 
                });
            }
            
            totalPrice += seatClass.price;
            bookedSeatDetails.push({
                seatNumber,
                classType: seat.classType,
                price: seatClass.price
            });
        }

        // Update seats to booked
        for (const seatNumber of seatNumbers) {
            const seatIndex = transport.seats.findIndex(s => s.seatNumber === seatNumber);
            transport.seats[seatIndex].isBooked = true;
        }

        await transport.save({ session });

        // Create booking record
        const bookingDate = new Date();
        const booking = new Booking({
            transportId,
            userId,
            seats: bookedSeatDetails,
            totalPrice,
            bookingDate,
            departureDateTime,
            status: 'confirmed'
        });

        await booking.save({ session });
        
        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: 'Booking created successfully',
            bookingId: booking._id,
            totalPrice,
            seats: bookedSeatDetails,
            bookingDate,
            departureDateTime,
            transportDetails: {
                type: transport.type,
                name: transport.name,
                source: transport.source,
                destination: transport.destination,
                departureTime: transport.departureTime,
                arrivalTime: transport.arrivalTime
            }
        });
    } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: error.message });
    }
};

// Cancel a booking with timeframe validation
exports.cancelBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { bookingId } = req.params;
        const { userId } = req.body; // For authorization
        
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        // Find the booking with session
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if user is authorized to cancel this booking
        if (booking.userId !== userId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ error: 'Not authorized to cancel this booking' });
        }

        // Check if booking is already cancelled
        if (booking.status === 'cancelled') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        // Check if the trip has already occurred
        const now = new Date();
        if (booking.departureDateTime < now) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: 'Cannot cancel booking for a trip that has already departed' });
        }

        // Calculate hours until departure
        const hoursUntilDeparture = (booking.departureDateTime - now) / (1000 * 60 * 60);
        
        // Define cancellation policy - e.g., must cancel at least 6 hours before departure
        const CANCELLATION_WINDOW_HOURS = 6;
        let refundPercentage = 100;
        
        if (hoursUntilDeparture < CANCELLATION_WINDOW_HOURS) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                error: `Cancellations must be made at least ${CANCELLATION_WINDOW_HOURS} hours before departure`,
                hoursUntilDeparture: Math.round(hoursUntilDeparture * 10) / 10
            });
        }
        
        // For graduated refund policy based on time to departure
        if (hoursUntilDeparture < 24) {
            refundPercentage = 75;  // 75% refund if less than 24 hours but more than CANCELLATION_WINDOW_HOURS
        } else if (hoursUntilDeparture < 72) {
            refundPercentage = 90;  // 90% refund if less than 72 hours but more than 24 hours
        }

        // Find the transport
        const transport = await Transport.findById(booking.transportId).session(session);
        if (!transport) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: 'Transport not found' });
        }

        // Update seats to available
        const seatNumbers = booking.seats.map(seat => seat.seatNumber);
        for (const seatNumber of seatNumbers) {
            const seatIndex = transport.seats.findIndex(s => s.seatNumber === seatNumber);
            if (seatIndex !== -1) {
                transport.seats[seatIndex].isBooked = false;
            }
        }

        await transport.save({ session });

        // Calculate refund amount
        const refundAmount = (booking.totalPrice * refundPercentage) / 100;

        // Update booking status
        booking.status = 'cancelled';
        booking.cancelledAt = now;
        booking.refundAmount = refundAmount;
        booking.refundPercentage = refundPercentage;
        await booking.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.json({
            message: 'Booking cancelled successfully',
            bookingId: booking._id,
            refundAmount,
            refundPercentage,
            cancelledAt: booking.cancelledAt,
            seats: seatNumbers
        });
    } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: error.message });
    }
};

// Get bookings for a user
exports.getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const bookings = await Booking.find({ userId }).sort({ bookingDate: -1 });
        
        // Enhance bookings with transport details
        const enhancedBookings = await Promise.all(bookings.map(async (booking) => {
            const transport = await Transport.findById(booking.transportId);
            return {
                ...booking.toObject(),
                transportDetails: transport ? {
                    type: transport.type,
                    name: transport.name,
                    source: transport.source,
                    destination: transport.destination,
                    departureTime: transport.departureTime,
                    arrivalTime: transport.arrivalTime
                } : null
            };
        }));

        res.json(enhancedBookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Get all bookings
exports.getAllBookings = async (req, res) => {
    try {
        // Get query parameters for pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count of bookings
        const totalBookings = await Booking.countDocuments();

        // Get bookings with pagination
        const bookings = await Booking.find()
            .sort({ bookingDate: -1 })
            .skip(skip)
            .limit(limit);

        // Enhance bookings with transport details
        const enhancedBookings = await Promise.all(bookings.map(async (booking) => {
            const transport = await Transport.findById(booking.transportId);
            return {
                ...booking.toObject(),
                transportDetails: transport ? {
                    type: transport.type,
                    name: transport.name,
                    source: transport.source,
                    destination: transport.destination,
                    departureTime: transport.departureTime,
                    arrivalTime: transport.arrivalTime
                } : null
            };
        }));

        res.json({
            bookings: enhancedBookings,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBookings / limit),
                totalBookings,
                hasMore: page * limit < totalBookings
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTransportBookings = async (req, res) => {
    try {
        const { transportId } = req.params;
        
        if (!transportId) {
            return res.status(400).json({ error: 'Transport ID is required' });
        }

        // Get query parameters for pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count of bookings for this transport
        const totalBookings = await Booking.countDocuments({ transportId });

        // Find all bookings for the specified transport with pagination
        const bookings = await Booking.find({ transportId })
            .sort({ bookingDate: -1 })
            .skip(skip)
            .limit(limit);

        // Get transport details
        const transport = await Transport.findById(transportId);
        if (!transport) {
            return res.status(404).json({ error: 'Transport not found' });
        }

        const transportDetails = {
            type: transport.type,
            name: transport.name,
            source: transport.source,
            destination: transport.destination,
            departureTime: transport.departureTime,
            arrivalTime: transport.arrivalTime
        };

        res.json({
            bookings,
            transportDetails,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBookings / limit),
                totalBookings,
                hasMore: page * limit < totalBookings
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

