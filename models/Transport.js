const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
  type: { type: String, enum: ['airline', 'train', 'bus'], required: true },
  name: { type: String, required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  distanceInKm: { type: Number, required: true },
  availableDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  classes: [
    {
      name: String,
      price: Number,
      defaultSeats: { type: Number, default: 10 }
    }
  ],
  seats: [
    {
      seatNumber: String,
      classType: String,
      isBooked: { type: Boolean, default: false }
    }
  ]
});

transportSchema.pre('save', function (next) {
  if (!this.seats || this.seats.length === 0) {
    let seatsArr = [];
    this.classes.forEach((cls, index) => {
      const count = cls.defaultSeats || 10;
      const prefix = String.fromCharCode(65 + index);
      for (let i = 1; i <= count; i++) {
        seatsArr.push({
          seatNumber: prefix + i,
          classType: cls.name,
          isBooked: false
        });
      }
    });
    this.seats = seatsArr;
  }
  next();
});

module.exports = mongoose.model('Transport', transportSchema);
