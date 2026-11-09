import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/client';
import FarmhouseCard from '../../components/FarmhouseCard';
import StatusBadge from '../../components/StatusBadge';
import { fmtDate } from '../../lib/constants';

export default function OwnerDashboard() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/farmhouses/mine/list').then((r) => setItems(r.data.items)).catch((e) => setError(errorMessage(e)));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My farmhouses</h1>
          <p className="text-gray-600">New listings go live after our team visits and approves them.</p>
        </div>
        <Link to="/owner/farmhouses/new" className="btn">+ Add farmhouse</Link>
      </div>
      {error && <p className="mt-6 text-red-600">{error}</p>}
      {items?.length === 0 && (
        <div className="card mt-6 text-center text-gray-600">You have not listed a farmhouse yet.</div>
      )}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((fh) => (
          <FarmhouseCard key={fh._id} fh={fh} to={`/owner/farmhouses/${fh._id}/edit`}>
            <div className="pt-2"><StatusBadge status={fh.status} /></div>
            {fh.status === 'pending' && fh.verification?.visitDate && (
              <p className="text-sm text-amber-700">Site visit scheduled for {fmtDate(fh.verification.visitDate)}</p>
            )}
            {fh.verification?.remarks && fh.status !== 'pending' && (
              <p className="text-sm text-gray-600">Admin remarks: {fh.verification.remarks}</p>
            )}
            {fh.status !== 'suspended' && (
              <Link to={`/owner/farmhouses/${fh._id}/edit`} className="inline-block pt-1 text-sm text-brand-600 hover:underline">Edit</Link>
            )}
          </FarmhouseCard>
        ))}
      </div>
    </div>
  );
}
