import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
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
        <h1 className="text-2xl font-bold">Log in</h1>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <input className="input" type="email" placeholder="Email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn w-full" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
        <p className="text-center text-sm text-gray-600">
          No account? <Link to="/register" className="text-brand-600 hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
