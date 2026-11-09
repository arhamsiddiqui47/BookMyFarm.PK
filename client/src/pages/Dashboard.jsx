import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

const COPY = {
  customer: { title: 'My bookings', next: 'Your upcoming and past bookings will show here (Week 5).' },
  owner: { title: 'Owner dashboard', next: 'Add your farmhouse and track its verification here (Week 2).' },
  admin: { title: 'Admin dashboard', next: 'Pending site-visit verifications will show here (Week 2).' },
};

// One component for all three roles for now. Each role gets its own page as features land.
export default function Dashboard({ role }) {
  const { user } = useAuth();
  const [msg, setMsg] = useState('');
  useEffect(() => {
    api.get(`/dashboard/${role}`).then((r) => setMsg(r.data.message)).catch((e) => setMsg(errorMessage(e)));
  }, [role]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">{COPY[role].title}</h1>
      <p className="mt-1 text-gray-600">{msg || `Hello ${user.name}`}</p>
      <div className="card mt-6 text-gray-500">{COPY[role].next}</div>
    </div>
  );
}
