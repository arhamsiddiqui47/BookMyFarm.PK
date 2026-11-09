const mongoose = require('mongoose');

// The double-booking guard. One document per (farmhouse, date, half-slot) that is taken.
// A "full" booking takes both "day" and "night". The unique index means MongoDB itself
// refuses a second booking for the same half-slot, even if two requests arrive at once.
const slotLockSchema = new mongoose.Schema({
  farmhouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmhouse', required: true },
  date: { type: String, required: true },
  half: { type: String, enum: ['day', 'night'], required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
});

slotLockSchema.index({ farmhouse: 1, date: 1, half: 1 }, { unique: true });

module.exports = mongoose.model('SlotLock', slotLockSchema);
