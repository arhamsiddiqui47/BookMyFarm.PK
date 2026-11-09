export const AREAS = [
  'Gadap Town', 'Super Highway', 'Malir', 'Memon Goth', 'Bahria Town', 'Northern Bypass',
  'Hawksbay', 'Gulshan-e-Maymar', 'Scheme 33', 'Other',
];

export const AMENITIES = [
  { id: 'pool', label: 'Swimming pool' },
  { id: 'kids-area', label: 'Kids play area' },
  { id: 'indoor-games', label: 'Indoor games' },
  { id: 'lawn', label: 'Lawn' },
  { id: 'bbq', label: 'BBQ area' },
  { id: 'rooms', label: 'Rooms / AC rooms' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'parking', label: 'Parking' },
  { id: 'generator', label: 'Generator / UPS' },
  { id: 'sound-system', label: 'Sound system' },
  { id: 'cricket', label: 'Cricket / sports ground' },
  { id: 'caretaker', label: 'Caretaker on site' },
];

export const amenityLabel = (id) => AMENITIES.find((a) => a.id === id)?.label || id;

export const SLOT_LABELS = { day: 'Day slot', night: 'Night slot', full: 'Full day (24h)' };

export const rupees = (n) => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
