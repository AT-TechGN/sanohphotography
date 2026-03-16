import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import Notification from '../components/common/Notification';
import {
  ChartBarIcon, CalendarDaysIcon, PhotoIcon,
  CameraIcon, StarIcon, UsersIcon, DocumentTextIcon,
  ArrowLeftOnRectangleIcon, Bars3Icon, XMarkIcon,
  BellIcon, HomeIcon, UserCircleIcon,
} from '@heroicons/react/24/outline';

/* ─────────────────────────────────────────────────────────────────────────────
   AdminLayout — sidebar desktop + bottom tabs mobile
───────────────────────────────────────────────────────────────────────────── */

const menuItems = [
  { path: '/admin',           label: 'Dashboard',     Icon: ChartBarIcon,     exact: true  },
  { path: '/admin/bookings',  label: 'Réservations',  Icon: CalendarDaysIcon              },
  { path: '/admin/photos',    label: 'Photos',        Icon: PhotoIcon                     },
  { path: '/admin/services',  label: 'Services',      Icon: CameraIcon                    },
  { path: '/admin/reviews',   label: 'Avis',          Icon: StarIcon                      },
  { path: '/admin/employees', label: 'Employés',      Icon: UsersIcon,       adminOnly: true },
  { path: '/admin/invoices',  label: 'Factures',      Icon: DocumentTextIcon, adminOnly: true },
];

const AdminLayout = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isAdmin       = user?.roles?.includes('ROLE_ADMIN');
  const isPhotographe = user?.roles?.includes('ROLE_PHOTOGRAPHE');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fermer sidebar mobile au changement de route
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const isActive = (p, exact = false) =>
    exact ? location.pathname === p : location.pathname.startsWith(p);

  const visibleItems = menuItems.filter(i => !i.adminOnly || isAdmin);

  // Sur mobile : on affiche max 5 tabs dans la bottom bar
  const bottomItems = [
    { path: '/admin',          label: 'Dashboard', Icon: ChartBarIcon,    exact: true },
    { path: '/admin/bookings', label: 'Séances',   Icon: CalendarDaysIcon             },
    { path: '/admin/photos',   label: 'Photos',    Icon: PhotoIcon                    },
    { path: '/admin/services', label: 'Services',  Icon: CameraIcon                   },
    { path: '/profile',        label: 'Profil',    Icon: UserCircleIcon               },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* ── Overlay mobile ───────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar desktop ──────────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64
        bg-gray-950 text-white flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <CameraIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">SanohPhoto</h1>
            <p className="text-[11px] text-gray-400">Panel admin</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 rounded-lg hover:bg-white/10">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="px-5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Navigation</p>
          <div className="space-y-0.5 px-3">
            {visibleItems.map(({ path, label, Icon, exact }) => {
              const active = isActive(path, exact);
              return (
                <Link key={path} to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    active
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}>
                  <Icon className="w-4.5 h-4.5 flex-shrink-0 w-5 h-5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </Link>
          <div className="flex gap-2">
            <Link to="/"
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors">
              <HomeIcon className="w-4 h-4" />Site
            </Link>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors">
              <ArrowLeftOnRectangleIcon className="w-4 h-4" />Quitter
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Bars3Icon className="w-5 h-5" />
              </button>
              {/* Breadcrumb courant */}
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:block">
                {visibleItems.find(i => isActive(i.path, i.exact))?.label ?? 'Administration'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <BellIcon className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
              </button>
              <Link to="/profile"
                className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Notification />
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Tabs ────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="flex">
          {bottomItems.map(({ path, label, Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link key={path} to={path}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95 ${
                  active ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'
                }`}>
                <div className={`p-1 rounded-xl ${active ? 'bg-amber-50 dark:bg-amber-500/10' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;
