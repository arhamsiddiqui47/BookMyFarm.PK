import { Link } from 'react-router-dom';
import { rupees } from '../lib/constants';

export default function FarmhouseCard({ fh, to, children }) {
  const prices = Object.values(fh.pricing || {}).filter((p) => p > 0);
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <Link to={to}>
        <img src={fh.photos?.[0]} alt={fh.name} className="h-44 w-full bg-gray-100 object-cover" />
      </Link>
      <div className="space-y-1 p-4">
        <Link to={to} className="font-semibold hover:text-brand-600">{fh.name}</Link>
        <p className="text-sm text-gray-600">{fh.area} · up to {fh.capacity} guests</p>
        {prices.length > 0 && <p className="text-sm font-medium">From {rupees(Math.min(...prices))}</p>}
        {children}
      </div>
    </div>
  );
}
