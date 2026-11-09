const mongoose = require('mongoose');
const Farmhouse = require('../models/Farmhouse');
const SlotLock = require('../models/SlotLock');
const { halvesFor, isDate } = require('../utils/slots');
const HttpError = require('../utils/httpError');
const { storeFiles } = require('../utils/upload');

const EDITABLE = [
  'name', 'description', 'area', 'address', 'capacity', 'amenities', 'houseRules', 'pricing',
  'advancePercent', 'cancelWindowHours', 'earlyCancelRefundPercent',
];

// Multipart forms send everything as text, so arrays and pricing arrive as JSON strings.
function parseBody(body) {
  const out = {};
  for (const key of EDITABLE) {
    if (body[key] === undefined || body[key] === '') continue;
    let v = body[key];
    if (['amenities', 'houseRules', 'pricing'].includes(key) && typeof v === 'string') {
      try { v = JSON.parse(v); } catch { throw new HttpError(400, `${key} is not valid`); }
    }
    out[key] = v;
  }
  if (out.pricing) {
    const { day, night, full } = out.pricing;
    if (![day, night, full].some((p) => Number(p) > 0)) throw new HttpError(400, 'Set a price for at least one slot');
  }
  return out;
}

async function findOwned(id, user) {
  const fh = await Farmhouse.findById(id);
  if (!fh) throw new HttpError(404, 'Farmhouse not found');
  if (!fh.owner.equals(user._id)) throw new HttpError(403, 'This is not your farmhouse');
  return fh;
}

// ---------- Public ----------

const PUBLIC_FIELDS = '-history -verification.visitedBy -verification.photos';
const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { minPrice: 1 },
  price_desc: { minPrice: -1 },
  capacity: { capacity: -1 },
  rating: { ratingAvg: -1 },
};

// Search verified farmhouses.
// Query params (all optional): area, guests, minPrice, maxPrice, amenities=pool,bbq,
// date=YYYY-MM-DD, slot=day|night|full, sort, page, limit.
// When a date is given, farmhouses already booked for that date and slot are left out.
exports.listPublic = async (req, res) => {
  const q = req.query;
  const filter = { status: 'approved' };
  const slot = ['day', 'night', 'full'].includes(q.slot) ? q.slot : null;

  if (q.area) filter.area = q.area;
  if (q.guests) filter.capacity = { $gte: Number(q.guests) || 1 };
  if (q.amenities) {
    const list = String(q.amenities).split(',').map((x) => x.trim()).filter(Boolean);
    if (list.length) filter.amenities = { $all: list };
  }
  // Price applies to the chosen slot, or to the cheapest slot when none is chosen.
  const priceField = slot ? `pricing.${slot}` : 'minPrice';
  if (q.minPrice || q.maxPrice) {
    filter[priceField] = {};
    if (q.minPrice) filter[priceField].$gte = Number(q.minPrice);
    if (q.maxPrice) filter[priceField].$lte = Number(q.maxPrice);
  }
  if (slot) filter[`pricing.${slot}`] = { ...(filter[`pricing.${slot}`] || {}), $gt: 0 };

  if (q.date) {
    if (!isDate(q.date)) throw new HttpError(400, 'Date must be YYYY-MM-DD');
    const halves = halvesFor(slot || 'full');
    // With no slot chosen, a farmhouse counts as available if at least one half is still free.
    let busy;
    if (slot) {
      busy = await SlotLock.distinct('farmhouse', { date: q.date, half: { $in: halves } });
    } else {
      const taken = await SlotLock.aggregate([
        { $match: { date: q.date } },
        { $group: { _id: '$farmhouse', n: { $sum: 1 } } },
        { $match: { n: { $gte: 2 } } },
      ]);
      busy = taken.map((t) => t._id);
    }
    if (busy.length) filter._id = { $nin: busy };
  }

  const limit = Math.min(Number(q.limit) || 12, 50);
  const page = Math.max(Number(q.page) || 1, 1);
  const [items, total] = await Promise.all([
    Farmhouse.find(filter)
      .select(PUBLIC_FIELDS)
      .sort(SORTS[q.sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Farmhouse.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
};

// Side-by-side comparison of up to 3 verified farmhouses: /api/farmhouses/compare?ids=a,b,c
exports.compare = async (req, res) => {
  const ids = String(req.query.ids || '').split(',').filter((id) => mongoose.isValidObjectId(id)).slice(0, 3);
  if (ids.length < 2) throw new HttpError(400, 'Pick 2 or 3 farmhouses to compare');
  const found = await Farmhouse.find({ _id: { $in: ids }, status: 'approved' }).select(PUBLIC_FIELDS);
  const items = ids.map((id) => found.find((f) => f._id.equals(id))).filter(Boolean);
  res.json({ items });
};

// Which half-days are booked in a month, for the calendar: /api/farmhouses/:id/availability?month=2026-12
exports.availability = async (req, res) => {
  const month = req.query.month;
  if (!/^\d{4}-\d{2}$/.test(month || '')) throw new HttpError(400, 'Month must be YYYY-MM');
  const fh = await Farmhouse.findOne({ _id: req.params.id, status: 'approved' }).select('_id');
  if (!fh) throw new HttpError(404, 'Farmhouse not found');
  const locks = await SlotLock.find({ farmhouse: fh._id, date: { $regex: `^${month}-` } }).select('date half -_id');
  const booked = {};
  for (const l of locks) (booked[l.date] ||= []).push(l.half);
  res.json({ month, booked });
};

exports.getPublic = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Farmhouse not found');
  const fh = await Farmhouse.findOne({ _id: req.params.id, status: 'approved' })
    .select(PUBLIC_FIELDS)
    .populate('owner', 'name');
  if (!fh) throw new HttpError(404, 'Farmhouse not found');
  res.json({ farmhouse: fh });
};

// ---------- Owner ----------

exports.listMine = async (req, res) => {
  const items = await Farmhouse.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ items });
};

exports.getMine = async (req, res) => {
  res.json({ farmhouse: await findOwned(req.params.id, req.user) });
};

exports.create = async (req, res) => {
  const data = parseBody(req.body);
  if (!data.pricing) throw new HttpError(400, 'Set a price for at least one slot');
  const photos = await storeFiles(req.files, 'farmhouses');
  if (photos.length === 0) throw new HttpError(400, 'Add at least one photo');
  const fh = await Farmhouse.create({
    ...data,
    owner: req.user._id,
    photos,
    status: 'pending',
    history: [{ action: 'submitted', by: req.user._id }],
  });
  res.status(201).json({ farmhouse: fh });
};

// Any change to a live listing sends it back for verification, so customers never see
// details the admin has not checked.
exports.update = async (req, res) => {
  const fh = await findOwned(req.params.id, req.user);
  if (fh.status === 'suspended') throw new HttpError(403, 'This listing is suspended. Contact the admin.');
  const data = parseBody(req.body);
  Object.assign(fh, data);
  const newPhotos = await storeFiles(req.files, 'farmhouses');
  let keep = fh.photos;
  if (req.body.keepPhotos !== undefined) {
    try { keep = JSON.parse(req.body.keepPhotos); } catch { throw new HttpError(400, 'keepPhotos is not valid'); }
    keep = fh.photos.filter((p) => keep.includes(p));
  }
  fh.photos = [...keep, ...newPhotos];
  if (fh.photos.length === 0) throw new HttpError(400, 'Keep at least one photo');
  if (fh.status === 'approved' || fh.status === 'rejected') {
    fh.status = 'pending';
    fh.history.push({ action: 'edited', by: req.user._id, remarks: 'Sent back for verification after edit' });
  }
  await fh.save();
  res.json({ farmhouse: fh });
};

exports.remove = async (req, res) => {
  const fh = await findOwned(req.params.id, req.user);
  // Week 4: block deletion while there are upcoming bookings.
  await fh.deleteOne();
  res.json({ ok: true });
};
