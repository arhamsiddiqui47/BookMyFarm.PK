import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { fmtDate } from '../../lib/constants';

const TABS = [
  { id: 'pending', label: 'Pending verification' },
  { id: 'approved', label: 'Live' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'users', label: 'Users' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
    const url = tab === 'users' ? '/admin/users' : `/admin/farmhouses?status=${tab}`;
    api.get(url).then((r) => setRows(r.data.items)).catch((e) => setError(errorMessage(e)));
  }, [tab]);
  useEffect(load, [load]);

  const toggleBlock = async (u) => {
    try {
      await api.patch(`/admin/users/${u._id}/block`, { blocked: !u.isBlocked });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Waiting for visit', stats.listings.pending || 0],
            ['Live listings', stats.listings.approved || 0],
            ['Owners', stats.users.owner || 0],
            ['Customers', stats.users.customer || 0],
          ].map(([label, n]) => (
            <div key={label} className="card p-4"><p className="text-2xl font-bold">{n}</p><p className="text-sm text-gray-600">{label}</p></div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-b">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-4 text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
        {tab === 'users' ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Joined</th><th className="p-3" /></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-3">{u.name}</td><td className="p-3">{u.email}</td><td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">{fmtDate(u.createdAt)}</td>
                  <td className="p-3 text-right">
                    {u.role !== 'admin' && (
                      <button onClick={() => toggleBlock(u)} className={u.isBlocked ? 'text-brand-600' : 'text-red-600'}>
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="p-3">Farmhouse</th><th className="p-3">Owner</th><th className="p-3">Area</th><th className="p-3">Status</th><th className="p-3">Site visit</th><th className="p-3" /></tr></thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f._id} className="border-t">
                  <td className="p-3 font-medium">{f.name}</td>
                  <td className="p-3">{f.owner?.name}<br /><span className="text-gray-500">{f.owner?.phone}</span></td>
                  <td className="p-3">{f.area}</td>
                  <td className="p-3"><StatusBadge status={f.status} /></td>
                  <td className="p-3">{f.verification?.visitDate ? fmtDate(f.verification.visitDate) : 'Not scheduled'}</td>
                  <td className="p-3 text-right"><Link to={`/admin/farmhouses/${f._id}`} className="text-brand-600 hover:underline">Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length === 0 && !error && <p className="p-6 text-center text-gray-500">Nothing here.</p>}
      </div>
    </div>
  );
}
