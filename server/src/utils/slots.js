// A booking slot maps to the half-days it occupies. "full" (24 hours) takes both.
const HALVES = { day: ['day'], night: ['night'], full: ['day', 'night'] };

function halvesFor(slot) {
  const h = HALVES[slot];
  if (!h) throw new Error(`Unknown slot: ${slot}`);
  return h;
}

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

module.exports = { HALVES, halvesFor, isDate };
