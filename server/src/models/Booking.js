const mongoose = require('mongoose');

const SLOTS = ['day', 'night', 'full'];
const ACTIVE = ['held', 'confirmed'];

const bookingSchema = new mongoose.Schema(
  {
    farmhouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmhouse', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD, Karachi local date
    slot: { type: String, enum: SLOTS, required: true },
    guests: { type: Number, min: 1 },
    totalAmount: { type: Number, required: true },
    advanceAmount: { type: Number, required: true },
    commissionAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['held', 'confirmed', 'cancelled', 'completed', 'expired'],
      default: 'held',
    },
    holdExpiresAt: Date,
    // Booking transfer: the original customer hands the booking to someone else.
    guestName: String,
    guestPhone: String,
    transferHistory: [
      {
        fromName: String,
        toName: String,
        toPhone: String,
        at: { type: Date, default: Date.now },
      },
    ],
    cancelledAt: Date,
    refundAmount: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.SLOTS = SLOTS;
module.exports.ACTIVE = ACTIVE;
