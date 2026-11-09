const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
