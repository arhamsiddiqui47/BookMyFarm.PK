const mongoose = require('mongoose');

// Prices are in PKR per slot. "day" and "night" are half-day slots, "full" is 24 hours.
const pricingSchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0 },
    night: { type: Number, min: 0 },
    full: { type: Number, min: 0 },
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    visitDate: Date,
    visitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: String,
    photos: [String],
    decidedAt: Date,
  },
  { _id: false }
);

const farmhouseSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    area: { type: String, required: true, trim: true }, // e.g. Gadap, Super Highway, Malir
    address: String,
    capacity: { type: Number, required: true, min: 1 },
    amenities: [String], // e.g. pool, kids-area, indoor-games, bbq, parking
    houseRules: [String],
    pricing: { type: pricingSchema, required: true },
    advancePercent: { type: Number, default: 30, min: 0, max: 100 },
    freeCancelHours: { type: Number, default: 72 },
    photos: [String], // Cloudinary URLs
    // Listing lifecycle: nothing is public until an admin approves after a site visit.
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    verification: verificationSchema,
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

farmhouseSchema.index({ status: 1, area: 1 });

module.exports = mongoose.model('Farmhouse', farmhouseSchema);
