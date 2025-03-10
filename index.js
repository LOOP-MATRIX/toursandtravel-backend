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


dotenv.config();
const Razorpay = require("razorpay");
const Payment = require("./models/Payment");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100,
      receipt: `order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.log(error);
    res.status(500).send("Some error occurred");
  }
});

app.post("/save-payment", async (req, res) => {
  const payment = new Payment(req.body);
  await payment.save();
  res.json({ message: "Payment saved successfully" });
});


app.get('/getpayment',async(req,res)=>{
    try{
        const payment = await Payment.find();
        res.status(200).json({payment})
    }catch(err){
        res.status(500).json({error:err.message})
    }
})