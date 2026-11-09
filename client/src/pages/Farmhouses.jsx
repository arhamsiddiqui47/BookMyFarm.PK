import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import FarmhouseCard from '../components/FarmhouseCard';

// Public list of verified farmhouses. Filters and compare come in Week 3.
export default function Farmhouses() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/farmhouses').then((r) => setItems(r.data.items)).catch((e) => setError(errorMessage(e)));
  }, []);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">Verified farmhouses in Karachi</h1>
      <p className="mt-1 text-gray-600">Every listing here was visited in person by our team.</p>
      {error && <p className="mt-6 text-red-600">{error}</p>}
      {items === null && !error && <p className="mt-6 text-gray-500">Loading...</p>}
      {items?.length === 0 && <p className="mt-6 text-gray-500">No verified farmhouses yet.</p>}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((fh) => <FarmhouseCard key={fh._id} fh={fh} to={`/farmhouses/${fh._id}`} />)}
      </div>
    </div>
  );
}
