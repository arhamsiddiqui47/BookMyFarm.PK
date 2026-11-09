import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Only lets a user in if they are logged in and have one of the allowed roles.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center text-gray-500">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/dashboard/${user.role}`} replace />;
  return children;
}
