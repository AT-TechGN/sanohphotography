import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import Notification from '../components/common/Notification';

const AdminLayout = () => {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/bookings', label: 'Réservations', icon: '📅' },
    { path: '/admin/services', label: 'Services', icon: '📸' },
    { path: '/admin/reviews', label: 'Avis clients', icon: '⭐' },
    { path: '/admin/employees', label: 'Employés', icon: '👥', adminOnly: true },
    { path: '/admin/invoices', label: 'Factures', icon: '💰', adminOnly: true },
  ];

  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">📸</span>
            <span className="text-xl font-bold">PhotoBook Admin</span>
          </Link>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600'
                    : 'hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
          <div className="mb-3">
            <p className="text-sm text-gray-400">Connecté en tant que</p>
            <p className="font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Notification />
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
