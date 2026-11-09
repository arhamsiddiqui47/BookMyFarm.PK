import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { amenityLabel, fmtDate, rupees, SLOT_LABELS } from '../../lib/constants';

// The verification screen: schedule a site visit, then approve or reject with remarks and visit photos.
export default function ReviewListing() {
  const { id } = useParams();
  const [fh, setFh] = useState(null);
  const [visitDate, setVisitDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [visitPhotos, setVisitPhotos] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/admin/farmhouses/${id}`).then((r) => setFh(r.data.farmhouse)).catch((e) => setError(errorMessage(e)));
  }, [id]);
  useEffect(load, [load]);

  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const decide = (decision) =>
    run(async () => {
      const fd = new FormData();
      fd.append('decision', decision);
      fd.append('remarks', remarks);
      visitPhotos.forEach((f) => fd.append('visitPhotos', f));
      await api.post(`/admin/farmhouses/${id}/decision`, fd);
      setRemarks('');
      setVisitPhotos([]);
    });

  if (!fh) return <p className="p-8 text-center text-gray-500">{error || 'Loading...'}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/dashboard/admin" className="text-sm text-brand-600">← Back to dashboard</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{fh.name}</h1>
        <StatusBadge status={fh.status} />
      </div>
      <p className="text-gray-600">Owner: {fh.owner?.name} · {fh.owner?.phone || fh.owner?.email}</p>
      {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {fh.photos.map((p) => <img key={p} src={p} alt="" className="h-32 w-full rounded object-cover" />)}
          </div>
          <div className="card space-y-2 text-sm">
            <p><b>Area:</b> {fh.area} {fh.address && `· ${fh.address}`}</p>
            <p><b>Capacity:</b> {fh.capacity} guests</p>
            <p><b>Prices:</b> {Object.entries(SLOT_LABELS).filter(([s]) => fh.pricing?.[s]).map(([s, l]) => `${l} ${rupees(fh.pricing[s])}`).join(' · ')}</p>
            <p><b>Claimed amenities (check on visit):</b> {fh.amenities.map(amenityLabel).join(', ') || 'None'}</p>
            {fh.description && <p className="whitespace-pre-line text-gray-700">{fh.description}</p>}
          </div>
          <div className="card">
            <h2 className="font-semibold">History</h2>
            <ol className="mt-2 space-y-1 text-sm">
              {fh.history.map((h, i) => (
                <li key={i}>{fmtDate(h.at)}: <b className="capitalize">{h.action.replace('-', ' ')}</b>{h.by?.name ? ` by ${h.by.name}` : ''}{h.remarks ? `: ${h.remarks}` : ''}</li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-4">
          {fh.status === 'pending' && (
            <>
              <div className="card space-y-3">
                <h2 className="font-semibold">1. Schedule site visit</h2>
                {fh.verification?.visitDate && <p className="text-sm text-gray-600">Scheduled: {fmtDate(fh.verification.visitDate)}</p>}
                <input type="date" className="input" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
                <button className="btn w-full" disabled={busy || !visitDate}
                  onClick={() => run(() => api.patch(`/admin/farmhouses/${id}/visit`, { visitDate }))}>
                  {fh.verification?.visitDate ? 'Reschedule visit' : 'Schedule visit'}
                </button>
              </div>
              <div className="card space-y-3">
                <h2 className="font-semibold">2. Decision after visit</h2>
                <textarea className="input" rows="3" placeholder="What did you check on site?" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                <label className="block text-sm">Visit photos (optional)
                  <input type="file" multiple accept="image/*" className="mt-1 block text-sm" onChange={(e) => setVisitPhotos([...e.target.files])} />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn" disabled={busy || !remarks || !fh.verification?.visitDate} onClick={() => decide('approve')}>Approve</button>
                  <button className="btn bg-red-600 hover:bg-red-700" disabled={busy || !remarks} onClick={() => decide('reject')}>Reject</button>
                </div>
                {!fh.verification?.visitDate && <p className="text-xs text-gray-500">Approve unlocks once a visit is scheduled.</p>}
              </div>
            </>
          )}
          {(fh.status === 'approved' || fh.status === 'suspended') && (
            <div className="card space-y-3">
              <h2 className="font-semibold">{fh.status === 'approved' ? 'Suspend listing' : 'Reinstate listing'}</h2>
              <textarea className="input" rows="2" placeholder="Reason" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              <button className={`btn w-full ${fh.status === 'approved' ? 'bg-red-600 hover:bg-red-700' : ''}`} disabled={busy}
                onClick={() => run(() => api.patch(`/admin/farmhouses/${id}/suspend`, { suspend: fh.status === 'approved', remarks }))}>
                {fh.status === 'approved' ? 'Suspend' : 'Reinstate'}
              </button>
            </div>
          )}
          {fh.verification?.photos?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold">Site visit photos</h2>
              <div className="mt-2 grid grid-cols-2 gap-2">{fh.verification.photos.map((p) => <img key={p} src={p} alt="" className="h-20 w-full rounded object-cover" />)}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
