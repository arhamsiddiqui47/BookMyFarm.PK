import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-brand-700">
          Bookmyfarm<span className="text-gray-500">.pk</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/farmhouses" className="hover:text-brand-600">Farmhouses</Link>
          {user ? (
            <>
              <Link to={`/dashboard/${user.role}`} className="hover:text-brand-600">Dashboard</Link>
              <span className="hidden text-gray-500 sm:inline">{user.name} ({user.role})</span>
              <button onClick={() => { logout(); navigate('/'); }} className="text-gray-600 hover:text-red-600">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-brand-600">Log in</Link>
              <Link to="/register" className="btn py-1.5">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
