import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import CompareButton from '../components/CompareButton';
import { amenityLabel, fmtDate, rupees, SLOT_LABELS } from '../lib/constants';

export default function FarmhouseDetail() {
  const { id } = useParams();
  const [fh, setFh] = useState(null);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(0);
  useEffect(() => {
    api.get(`/farmhouses/${id}`).then((r) => setFh(r.data.farmhouse)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <p className="p-8 text-center text-red-600">{error}</p>;
  if (!fh) return <p className="p-8 text-center text-gray-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{fh.name}</h1>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          Verified by site visit{fh.verification?.decidedAt ? ` on ${fmtDate(fh.verification.decidedAt)}` : ''}
        </span>
      </div>
      <CompareButton fh={fh} className="mt-2" />
      <p className="mt-1 text-gray-600">{fh.area}{fh.address ? ` · ${fh.address}` : ''} · up to {fh.capacity} guests</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <img src={fh.photos[photo]} alt="" className="h-80 w-full rounded-xl bg-gray-100 object-cover sm:h-[28rem]" />
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {fh.photos.map((p, i) => (
              <button key={p} onClick={() => setPhoto(i)}>
                <img src={p} alt="" className={`h-16 w-24 rounded object-cover ${i === photo ? 'ring-2 ring-brand-600' : ''}`} />
              </button>
            ))}
          </div>
          {fh.description && <p className="mt-6 whitespace-pre-line text-gray-700">{fh.description}</p>}
          <h2 className="mt-6 text-lg font-semibold">Amenities</h2>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-gray-700 sm:grid-cols-3">
            {fh.amenities.map((a) => <li key={a}>✓ {amenityLabel(a)}</li>)}
          </ul>
          {fh.houseRules?.length > 0 && (
            <>
              <h2 className="mt-6 text-lg font-semibold">House rules</h2>
              <ul className="mt-2 list-disc pl-5 text-gray-700">{fh.houseRules.map((r) => <li key={r}>{r}</li>)}</ul>
            </>
          )}
        </div>
        <aside className="card h-fit space-y-3">
          <h2 className="text-lg font-semibold">Prices</h2>
          {Object.entries(SLOT_LABELS).map(([slot, label]) =>
            fh.pricing?.[slot] ? (
              <div key={slot} className="flex justify-between"><span>{label}</span><span className="font-medium">{rupees(fh.pricing[slot])}</span></div>
            ) : null
          )}
          <p className="border-t pt-3 text-sm text-gray-600">
            {fh.advancePercent}% advance to confirm. Cancel more than {fh.cancelWindowHours} hours before your date and{' '}
            {fh.earlyCancelRefundPercent}% of the advance is refunded. Within {fh.cancelWindowHours} hours, no refund.
          </p>
          <button className="btn w-full" disabled title="Booking opens in Week 4">Book now (coming soon)</button>
        </aside>
      </div>
    </div>
  );
}
