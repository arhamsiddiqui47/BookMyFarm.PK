import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {['customer', 'owner', 'admin'].map((role) => (
          <Route key={role} path={`/dashboard/${role}`}
            element={<ProtectedRoute roles={[role]}><Dashboard role={role} /></ProtectedRoute>} />
        ))}
        <Route path="*" element={<p className="p-8 text-center">Page not found</p>} />
      </Routes>
    </>
  );
}
