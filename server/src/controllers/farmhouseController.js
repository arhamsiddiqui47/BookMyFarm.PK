const Farmhouse = require('../models/Farmhouse');
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

// Only approved listings are ever shown to the public. Search filters arrive in Week 3.
exports.listPublic = async (req, res) => {
  const items = await Farmhouse.find({ status: 'approved' })
    .select('-history -verification.visitedBy')
    .sort({ createdAt: -1 });
  res.json({ items });
};

exports.getPublic = async (req, res) => {
  const fh = await Farmhouse.findOne({ _id: req.params.id, status: 'approved' })
    .select('-history')
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
