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
    visitDate: Date, // scheduled site visit
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
    // Booking and cancellation policy (Vintage Vista defaults):
    // 30% advance. Cancel more than 72 hours before the booking date and 30% of the advance is
    // refunded. Cancel within 72 hours and nothing is refunded.
    advancePercent: { type: Number, default: 30, min: 0, max: 100 },
    cancelWindowHours: { type: Number, default: 72, min: 0 },
    earlyCancelRefundPercent: { type: Number, default: 30, min: 0, max: 100 },
    photos: [String], // Cloudinary URLs
    // Listing lifecycle: nothing is public until an admin approves after a site visit.
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    verification: { type: verificationSchema, default: () => ({}) },
    // Full history of admin actions, so the panel can see who verified what and when.
    history: [
      {
        action: String, // submitted, visit-scheduled, approved, rejected, suspended, reinstated, edited
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        remarks: String,
        at: { type: Date, default: Date.now },
      },
    ],
    // Cheapest offered slot, kept up to date on save so search can filter and sort by price.
    minPrice: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

farmhouseSchema.pre('save', function setMinPrice(next) {
  const prices = ['day', 'night', 'full'].map((k) => this.pricing?.[k]).filter((p) => p > 0);
  this.minPrice = prices.length ? Math.min(...prices) : 0;
  next();
});

farmhouseSchema.index({ status: 1, area: 1 });
farmhouseSchema.index({ status: 1, minPrice: 1 });

module.exports = mongoose.model('Farmhouse', farmhouseSchema);
