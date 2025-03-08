const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const travelRoutes = require('./routes/transportRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const serviceProviderRoutes = require('./routes/serviceProviderRoutes');


dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/transport', travelRoutes);
app.use('/booking', bookingRoutes);
app.use('/service', serviceProviderRoutes);

//server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
