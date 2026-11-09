// Central error handler so every route returns { message } with the right status code.
function notFound(req, res) {
  res.status(404).json({ message: `Not found: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Already exists', fields: Object.keys(err.keyValue || {}) });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Server error' : err.message });
}

module.exports = { notFound, errorHandler };
