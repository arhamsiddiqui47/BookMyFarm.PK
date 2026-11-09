import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Farmhouses from './pages/Farmhouses';
import FarmhouseDetail from './pages/FarmhouseDetail';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import FarmhouseForm from './pages/owner/FarmhouseForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import ReviewListing from './pages/admin/ReviewListing';

const only = (role, el) => <ProtectedRoute roles={[role]}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/farmhouses" element={<Farmhouses />} />
        <Route path="/farmhouses/:id" element={<FarmhouseDetail />} />

        <Route path="/dashboard/customer" element={only('customer', <Dashboard role="customer" />)} />

        <Route path="/dashboard/owner" element={only('owner', <OwnerDashboard />)} />
        <Route path="/owner/farmhouses/new" element={only('owner', <FarmhouseForm />)} />
        <Route path="/owner/farmhouses/:id/edit" element={only('owner', <FarmhouseForm />)} />

        <Route path="/dashboard/admin" element={only('admin', <AdminDashboard />)} />
        <Route path="/admin/farmhouses/:id" element={only('admin', <ReviewListing />)} />

        <Route path="*" element={<p className="p-8 text-center">Page not found</p>} />
      </Routes>
    </>
  );
}
