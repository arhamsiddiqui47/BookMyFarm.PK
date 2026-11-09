import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { AMENITIES, rupees, SLOT_LABELS, fmtDate } from '../lib/constants';
import { useCompare } from '../context/CompareContext';

// Side-by-side table of 2 or 3 farmhouses. The cheapest price and biggest capacity are highlighted.
export default function Compare() {
  const [params] = useSearchParams();
  const { toggle } = useCompare();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/farmhouses/compare', { params: { ids: params.get('ids') } })
      .then((r) => setItems(r.data.items))
      .catch((e) => setError(errorMessage(e)));
  }, [params]);

  if (error) return <p className="p-8 text-center text-red-600">{error} <Link to="/farmhouses" className="text-brand-600 underline">Back to search</Link></p>;
  if (!items) return <p className="p-8 text-center text-gray-500">Loading...</p>;

  const best = (vals, fn) => { const v = vals.filter((x) => x > 0); return v.length > 1 ? fn(...v) : null; };
  const priceBest = Object.fromEntries(Object.keys(SLOT_LABELS).map((s) => [s, best(items.map((f) => f.pricing?.[s]), Math.min)]));
  const capBest = best(items.map((f) => f.capacity), Math.max);
  const usedAmenities = AMENITIES.filter((a) => items.some((f) => f.amenities.includes(a.id)));
  const hi = 'bg-green-50 font-semibold text-green-800';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/farmhouses" className="text-sm text-brand-600">← Back to search</Link>
      <h1 className="mt-2 text-2xl font-bold">Compare farmhouses</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="w-40 p-3" />
              {items.map((f) => (
                <th key={f._id} className="p-3 text-left align-top">
                  <img src={f.photos[0]} alt="" className="h-32 w-full rounded-lg bg-gray-100 object-cover" />
                  <Link to={`/farmhouses/${f._id}`} className="mt-2 block text-base font-semibold hover:text-brand-600">{f.name}</Link>
                  <button onClick={() => toggle(f)} className="text-xs font-normal text-gray-500 hover:text-red-600">Remove from compare</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Area">{items.map((f) => <td key={f._id} className="p-3">{f.area}</td>)}</Row>
            <Row label="Max guests">{items.map((f) => <td key={f._id} className={`p-3 ${f.capacity === capBest ? hi : ''}`}>{f.capacity}</td>)}</Row>
            {Object.entries(SLOT_LABELS).map(([s, l]) => (
              <Row key={s} label={l}>
                {items.map((f) => (
                  <td key={f._id} className={`p-3 ${f.pricing?.[s] && f.pricing[s] === priceBest[s] ? hi : ''}`}>
                    {f.pricing?.[s] ? rupees(f.pricing[s]) : <span className="text-gray-400">Not offered</span>}
                  </td>
                ))}
              </Row>
            ))}
            <Row label="Advance">{items.map((f) => <td key={f._id} className="p-3">{f.advancePercent}%</td>)}</Row>
            <Row label="Cancellation">
              {items.map((f) => (
                <td key={f._id} className="p-3">{f.earlyCancelRefundPercent}% of advance back if more than {f.cancelWindowHours}h before</td>
              ))}
            </Row>
            <Row label="Verified on">{items.map((f) => <td key={f._id} className="p-3">{fmtDate(f.verification?.decidedAt) || 'Yes'}</td>)}</Row>
            {usedAmenities.map((a) => (
              <Row key={a.id} label={a.label}>
                {items.map((f) => (
                  <td key={f._id} className="p-3">{f.amenities.includes(a.id) ? <span className="text-green-700">✓ Yes</span> : <span className="text-gray-400">No</span>}</td>
                ))}
              </Row>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <tr className="border-t">
      <th className="bg-gray-50 p-3 text-left font-medium text-gray-600">{label}</th>
      {children}
    </tr>
  );
}
