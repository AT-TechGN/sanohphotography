import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../stores/authStore';
import Notification from '../components/common/Notification';
import {
  HomeIcon,
  CalendarDaysIcon,
  CameraIcon,
  StarIcon,
  UsersIcon,
  DocumentTextIcon,
  PhotoIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: ChartBarIcon, exact: true },
    { path: '/admin/bookings', label: 'Réservations', icon: CalendarDaysIcon },
    { path: '/admin/photos', label: 'Photos & Albums', icon: PhotoIcon },
    { path: '/admin/services', label: 'Services', icon: CameraIcon },
    { path: '/admin/reviews', label: 'Avis clients', icon: StarIcon },
    { path: '/admin/employees', label: 'Employés', icon: UsersIcon, adminOnly: true },
    { path: '/admin/invoices', label: 'Factures', icon: DocumentTextIcon, adminOnly: true },
  ];

  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isPhotographe = user?.roles?.includes('ROLE_PHOTOGRAPHE');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (itemPath, exact = false) => {
    if (exact) {
      return location.pathname === itemPath;
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <CameraIcon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold">PhotoBook</h1>
                <p className="text-xs text-purple-200">Administration</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;

              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    active
                      ? 'bg-white text-purple-600 shadow-lg shadow-purple-900/50'
                      : 'text-purple-100 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-purple-600' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-purple-200 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-purple-500/30 rounded-full">
                  {isAdmin ? '🔑 Admin' : isPhotographe ? '📷 Photographe' : '👷 Employé'}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>

              {/* Search bar */}
              <div className="flex-1 max-w-xl hidden md:block">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <BellIcon className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <Link
                  to="/"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>Voir le site</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Notification />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
