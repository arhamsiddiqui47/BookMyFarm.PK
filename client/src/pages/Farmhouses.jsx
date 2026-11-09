import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import FarmhouseCard from '../components/FarmhouseCard';
import CompareButton from '../components/CompareButton';
import { AMENITIES, AREAS, SLOT_LABELS } from '../lib/constants';

const today = () => new Date().toISOString().slice(0, 10);

// Search page. Filters live in the URL (?area=...&date=...) so results can be shared and survive reloads.
export default function Farmhouses() {
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState(() => ({
    date: params.get('date') || '',
    slot: params.get('slot') || '',
    area: params.get('area') || '',
    guests: params.get('guests') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    amenities: params.get('amenities') ? params.get('amenities').split(',') : [],
    sort: params.get('sort') || 'newest',
  }));
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    setError('');
    api.get('/farmhouses', { params: Object.fromEntries(params) })
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [params]);

  const apply = (e, override = {}) => {
    e?.preventDefault();
    const next = { ...form, ...override };
    const q = {};
    Object.entries(next).forEach(([k, v]) => {
      if (k === 'amenities') { if (v.length) q.amenities = v.join(','); } else if (v) q[k] = v;
    });
    setParams(q);
  };
  const reset = () => {
    const blank = { date: '', slot: '', area: '', guests: '', minPrice: '', maxPrice: '', amenities: [], sort: 'newest' };
    setForm(blank);
    setParams({});
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleAmenity = (id) =>
    setForm({ ...form, amenities: form.amenities.includes(id) ? form.amenities.filter((x) => x !== id) : [...form.amenities, id] });
  const goPage = (p) => { const q = Object.fromEntries(params); q.page = p; setParams(q); };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold">Verified farmhouses in Karachi</h1>
      <p className="mt-1 text-gray-600">Every listing here was visited in person by our team.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        <form onSubmit={apply} className="card h-fit space-y-4 p-4 lg:sticky lg:top-4">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <label className="text-sm">Date
              <input type="date" min={today()} className="input mt-1" value={form.date} onChange={set('date')} />
            </label>
            <label className="text-sm">Slot
              <select className="input mt-1" value={form.slot} onChange={set('slot')}>
                <option value="">Any slot</option>
                {Object.entries(SLOT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-sm">Area
            <select className="input mt-1" value={form.area} onChange={set('area')}>
              <option value="">All areas</option>
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label className="block text-sm">Guests
            <input type="number" min="1" className="input mt-1" placeholder="e.g. 40" value={form.guests} onChange={set('guests')} />
          </label>
          <div className="text-sm">Price (PKR{form.slot ? `, ${SLOT_LABELS[form.slot].toLowerCase()}` : ''})
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input type="number" min="0" className="input" placeholder="Min" value={form.minPrice} onChange={set('minPrice')} />
              <input type="number" min="0" className="input" placeholder="Max" value={form.maxPrice} onChange={set('maxPrice')} />
            </div>
          </div>
          <fieldset className="text-sm">
            <legend>Must have</legend>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {AMENITIES.map((a) => (
                <button type="button" key={a.id} onClick={() => toggleAmenity(a.id)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${form.amenities.includes(a.id) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300'}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button className="btn flex-1">Search</button>
            <button type="button" onClick={reset} className="rounded-lg border px-3 text-sm">Reset</button>
          </div>
        </form>

        <section className="lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-600">
              {data ? `${data.total} farmhouse${data.total === 1 ? '' : 's'}${params.get('date') ? ` available on ${params.get('date')}` : ''}` : ''}
            </p>
            <select className="input w-auto py-1.5 text-sm" value={form.sort}
              onChange={(e) => { setForm({ ...form, sort: e.target.value }); apply(null, { sort: e.target.value }); }}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="capacity">Most guests</option>
            </select>
          </div>
          {error && <p className="mt-6 text-red-600">{error}</p>}
          {!data && !error && <p className="mt-6 text-gray-500">Loading...</p>}
          {data?.items.length === 0 && (
            <div className="card mt-4 text-center text-gray-600">No farmhouses match. Try another date or fewer filters.</div>
          )}
          <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {data?.items.map((fh) => {
              const q = params.get('date') ? `?date=${params.get('date')}${params.get('slot') ? `&slot=${params.get('slot')}` : ''}` : '';
              return (
                <FarmhouseCard key={fh._id} fh={fh} to={`/farmhouses/${fh._id}${q}`}>
                  <p className="text-xs text-gray-500">{fh.amenities.slice(0, 3).map((a) => AMENITIES.find((x) => x.id === a)?.label || a).join(' · ')}</p>
                  <CompareButton fh={fh} className="pt-1" />
                </FarmhouseCard>
              );
            })}
          </div>
          {data?.pages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button disabled={page <= 1} onClick={() => goPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Previous</button>
              <span className="px-2 py-1 text-sm">Page {page} of {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => goPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
