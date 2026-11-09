const Farmhouse = require('../models/Farmhouse');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const { storeFiles } = require('../utils/upload');

async function load(id) {
  const fh = await Farmhouse.findById(id);
  if (!fh) throw new HttpError(404, 'Farmhouse not found');
  return fh;
}

exports.stats = async (req, res) => {
  const [byStatus, users] = await Promise.all([
    Farmhouse.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]),
  ]);
  const toObj = (arr) => Object.fromEntries(arr.map((x) => [x._id, x.n]));
  res.json({ listings: toObj(byStatus), users: toObj(users) });
};

exports.listFarmhouses = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const items = await Farmhouse.find(filter)
    .populate('owner', 'name email phone')
    .populate('history.by', 'name role')
    .sort({ updatedAt: -1 });
  res.json({ items });
};

exports.getFarmhouse = async (req, res) => {
  const fh = await Farmhouse.findById(req.params.id)
    .populate('owner', 'name email phone')
    .populate('history.by', 'name role');
  if (!fh) throw new HttpError(404, 'Farmhouse not found');
  res.json({ farmhouse: fh });
};

// Step 1 of verification: the admin books a date to visit the farmhouse.
exports.scheduleVisit = async (req, res) => {
  const fh = await load(req.params.id);
  if (fh.status !== 'pending') throw new HttpError(400, 'Only pending listings need a visit');
  fh.verification.visitDate = new Date(req.body.visitDate);
  fh.history.push({ action: 'visit-scheduled', by: req.user._id, remarks: `Visit on ${req.body.visitDate}` });
  await fh.save();
  res.json({ farmhouse: fh });
};

// Step 2: after the visit, approve or reject with remarks and optional visit photos.
exports.decide = async (req, res) => {
  const fh = await load(req.params.id);
  const { decision, remarks } = req.body;
  if (fh.status !== 'pending') throw new HttpError(400, 'This listing is not waiting for a decision');
  if (decision === 'approve' && !fh.verification.visitDate) {
    throw new HttpError(400, 'Schedule and complete the site visit before approving');
  }
  const visitPhotos = await storeFiles(req.files, 'verification');
  fh.status = decision === 'approve' ? 'approved' : 'rejected';
  fh.verification.visitedBy = req.user._id;
  fh.verification.remarks = remarks;
  fh.verification.decidedAt = new Date();
  fh.verification.photos = [...(fh.verification.photos || []), ...visitPhotos];
  fh.history.push({ action: fh.status, by: req.user._id, remarks });
  await fh.save();
  res.json({ farmhouse: fh });
};

exports.setSuspended = async (req, res) => {
  const fh = await load(req.params.id);
  const suspend = req.body.suspend !== false;
  if (suspend && fh.status !== 'approved') throw new HttpError(400, 'Only live listings can be suspended');
  if (!suspend && fh.status !== 'suspended') throw new HttpError(400, 'This listing is not suspended');
  fh.status = suspend ? 'suspended' : 'approved';
  fh.history.push({ action: suspend ? 'suspended' : 'reinstated', by: req.user._id, remarks: req.body.remarks });
  await fh.save();
  res.json({ farmhouse: fh });
};

exports.listUsers = async (req, res) => {
  const filter = req.query.role ? { role: req.query.role } : {};
  const items = await User.find(filter).sort({ createdAt: -1 });
  res.json({ items });
};

exports.setBlocked = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (user.role === 'admin') throw new HttpError(400, 'Admins cannot be blocked');
  user.isBlocked = Boolean(req.body.blocked);
  await user.save();
  res.json({ user });
};
