const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  order_id: String,
  payment_id: String,
  status: String,
  amount: Number,
  currency: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);