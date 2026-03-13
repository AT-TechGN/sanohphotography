import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';

// Pages publiques
import HomePage from '../pages/HomePage';
import GalleryPage from '../pages/GalleryPage';
import ServicesPage from '../pages/ServicesPage';
import BookingPage from '../pages/BookingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Pages client
import ClientDashboard from '../pages/ClientDashboard';

// Pages admin
import AdminDashboard from '../pages/AdminDashboard';
import BookingsManagement from '../pages/admin/BookingsManagement';
import PhotosManagement from '../pages/admin/PhotosManagement';
import ServicesManagement from '../pages/admin/ServicesManagement';
import ReviewsModeration from '../pages/admin/ReviewsModeration';
import EmployeesManagement from '../pages/admin/EmployeesManagement';
import InvoicesManagement from '../pages/admin/InvoicesManagement';

// Composant de protection de route
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, hasRole } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.some((role) => hasRole(role))) {
    
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Routes publiques - Réservation */}
        <Route
          path="/booking"
          element={
            <MainLayout hideNavbar hideFooter />
          }
        >
          <Route index element={<BookingPage />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['ROLE_CLIENT']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboard />} />
        </Route>

        {/* Routes admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ROLE_PHOTOGRAPHE', 'ROLE_ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="bookings" element={<BookingsManagement />} />
          <Route path="photos" element={<PhotosManagement />} />
          <Route path="services" element={<ServicesManagement />} />
          <Route path="reviews" element={<ReviewsModeration />} />
          <Route path="employees" element={<EmployeesManagement />} />
          <Route path="invoices" element={<InvoicesManagement />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

