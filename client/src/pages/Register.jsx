import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: params.get('role') === 'owner' ? 'owner' : 'customer',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = { ...form };
      if (!payload.phone) delete payload.phone;
      const user = await register(payload);
      navigate(`/dashboard/${user.role}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <div className="grid grid-cols-2 gap-2">
          {['customer', 'owner'].map((r) => (
            <button type="button" key={r} onClick={() => setForm({ ...form, role: r })}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${form.role === r ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300'}`}>
              {r === 'customer' ? 'I want to book' : 'I own a farmhouse'}
            </button>
          ))}
        </div>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <input className="input" placeholder="Full name" required value={form.name} onChange={set('name')} />
        <input className="input" type="email" placeholder="Email" required value={form.email} onChange={set('email')} />
        <input className="input" placeholder="Mobile (03xxxxxxxxx)" value={form.phone} onChange={set('phone')} />
        <input className="input" type="password" placeholder="Password (min 6 characters)" required minLength={6}
          value={form.password} onChange={set('password')} />
        <button className="btn w-full" disabled={busy}>{busy ? 'Creating...' : 'Sign up'}</button>
        <p className="text-center text-sm text-gray-600">
          Already registered? <Link to="/login" className="text-brand-600 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
