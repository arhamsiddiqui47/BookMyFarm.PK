import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../../api/client';
import { AMENITIES, AREAS, SLOT_LABELS } from '../../lib/constants';

const EMPTY = {
  name: '', description: '', area: AREAS[0], address: '', capacity: '',
  amenities: [], houseRules: '', pricing: { day: '', night: '', full: '' },
};

// Used for both "add" and "edit". Sends multipart form data because it includes photos.
export default function FarmhouseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/farmhouses/mine/${id}`).then(({ data: { farmhouse: f } }) => {
      setForm({
        name: f.name, description: f.description || '', area: f.area, address: f.address || '',
        capacity: f.capacity, amenities: f.amenities, houseRules: (f.houseRules || []).join('\n'),
        pricing: { day: f.pricing.day || '', night: f.pricing.night || '', full: f.pricing.full || '' },
      });
      setExistingPhotos(f.photos);
      setStatus(f.status);
    }).catch((e) => setError(errorMessage(e)));
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleAmenity = (a) =>
    setForm({ ...form, amenities: form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a] });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      ['name', 'description', 'area', 'address', 'capacity'].forEach((k) => fd.append(k, form[k]));
      fd.append('amenities', JSON.stringify(form.amenities));
      fd.append('houseRules', JSON.stringify(form.houseRules.split('\n').map((r) => r.trim()).filter(Boolean)));
      const pricing = Object.fromEntries(Object.entries(form.pricing).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)]));
      fd.append('pricing', JSON.stringify(pricing));
      newFiles.forEach((f) => fd.append('photos', f));
      if (id) {
        fd.append('keepPhotos', JSON.stringify(existingPhotos));
        await api.patch(`/farmhouses/${id}`, fd);
      } else {
        await api.post('/farmhouses', fd);
      }
      navigate('/dashboard/owner');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <form onSubmit={submit} className="card space-y-5">
        <h1 className="text-2xl font-bold">{id ? 'Edit farmhouse' : 'Add your farmhouse'}</h1>
        {status === 'approved' && (
          <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
            This listing is live. Saving changes sends it back for verification and hides it until approved.
          </p>
        )}
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-medium">Farmhouse name</span>
            <input className="input mt-1" required value={form.name} onChange={set('name')} />
          </label>
          <label>
            <span className="text-sm font-medium">Area</span>
            <select className="input mt-1" value={form.area} onChange={set('area')}>
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium">Max guests</span>
            <input className="input mt-1" type="number" min="1" required value={form.capacity} onChange={set('capacity')} />
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-medium">Address</span>
            <input className="input mt-1" value={form.address} onChange={set('address')} />
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-medium">Description</span>
            <textarea className="input mt-1" rows="4" value={form.description} onChange={set('description')} />
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Prices per slot (PKR). Leave a slot empty if you don't offer it.</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {Object.entries(SLOT_LABELS).map(([slot, label]) => (
              <label key={slot}>
                <span className="text-xs text-gray-600">{label}</span>
                <input className="input mt-1" type="number" min="0" value={form.pricing[slot]}
                  onChange={(e) => setForm({ ...form, pricing: { ...form.pricing, [slot]: e.target.value } })} />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Amenities</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button type="button" key={a.id} onClick={() => toggleAmenity(a.id)}
                className={`rounded-full border px-3 py-1 text-sm ${form.amenities.includes(a.id) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300'}`}>
                {a.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium">House rules (one per line)</span>
          <textarea className="input mt-1" rows="3" value={form.houseRules} onChange={set('houseRules')}
            placeholder={'No loud music after 11pm\nNo smoking inside rooms'} />
        </label>

        <div>
          <span className="text-sm font-medium">Photos (JPG, PNG or WEBP, under 5 MB each)</span>
          {existingPhotos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {existingPhotos.map((p) => (
                <div key={p} className="relative">
                  <img src={p} alt="" className="h-20 w-28 rounded object-cover" />
                  <button type="button" onClick={() => setExistingPhotos(existingPhotos.filter((x) => x !== p))}
                    className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">Remove</button>
                </div>
              ))}
            </div>
          )}
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="mt-2 block text-sm"
            onChange={(e) => setNewFiles([...e.target.files])} />
        </div>

        <button className="btn w-full" disabled={busy}>
          {busy ? 'Saving...' : id ? 'Save and send for verification' : 'Submit for verification'}
        </button>
      </form>
    </div>
  );
}
