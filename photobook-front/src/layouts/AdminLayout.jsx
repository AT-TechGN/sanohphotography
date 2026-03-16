import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import Notification from '../components/common/Notification';
import { useEffect, useRef } from 'react';
import {
  ChartBarIcon, CalendarDaysIcon, PhotoIcon,
  CameraIcon, StarIcon, UsersIcon, DocumentTextIcon,
  ArrowLeftOnRectangleIcon, Bars3Icon, XMarkIcon,
  BellIcon, HomeIcon, UserCircleIcon, EnvelopeIcon,
} from '@heroicons/react/24/outline';
import useNotificationStore from '../stores/notificationStore';

const MENU = [
  { path: '/admin',           label: 'Dashboard',    Icon: ChartBarIcon,     exact: true       },
  { path: '/admin/bookings',  label: 'Réservations', Icon: CalendarDaysIcon                    },
  { path: '/admin/photos',    label: 'Photos',       Icon: PhotoIcon                           },
  { path: '/admin/services',  label: 'Services',     Icon: CameraIcon                          },
  { path: '/admin/reviews',   label: 'Avis clients', Icon: StarIcon                            },
  { path: '/admin/employees', label: 'Employés',     Icon: UsersIcon,        adminOnly: true   },
  { path: '/admin/invoices',  label: 'Factures',     Icon: DocumentTextIcon, adminOnly: true   },
  { path: '/admin/messages',  label: 'Messages',     Icon: EnvelopeIcon,                    },
];

// Bottom tabs mobile : max 5 items les plus utiles
const BOTTOM_TABS = [
  { path: '/admin',           label: 'Dashboard',   Icon: ChartBarIcon,    exact: true },
  { path: '/admin/bookings',  label: 'Séances',     Icon: CalendarDaysIcon             },
  { path: '/admin/photos',    label: 'Photos',      Icon: PhotoIcon                    },
  { path: '/admin/services',  label: 'Services',    Icon: CameraIcon                   },
  { path: '/admin/messages',   label: 'Messages',    Icon: EnvelopeIcon                 },
  { path: '/profile',         label: 'Profil',      Icon: UserCircleIcon               },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const { total, unreadMessages, pendingBookings, startPolling, stopPolling } = useNotificationStore();
  const prevTotalRef = useRef(0);
  const audioRef = useRef(null);

  // Démarrer le polling notifications dès que l'admin est connecté
  useEffect(() => {
    startPolling(30000); // toutes les 30s
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // Alerte sonore + notification browser quand nouveau message/réservation
  useEffect(() => {
    if (total > prevTotalRef.current && prevTotalRef.current > 0) {
      // Notification browser (si permission accordée)
      if (Notification.permission === 'granted') {
        new Notification('SanohPhoto — Nouvelle notification', {
          body: unreadMessages > 0
            ? \`\${unreadMessages} nouveau(x) message(s) de contact\`
            : \`\${pendingBookings} réservation(s) en attente\`,
          icon: '/favicon.ico',
        });
      }
    }
    prevTotalRef.current = total;
  }, [total, unreadMessages, pendingBookings]);

  // Demander la permission notifications browser au montage
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fermer sidebar sur changement de route
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Bloquer le scroll du body quand sidebar ouverte sur mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const isActive = (p, exact = false) =>
    exact ? location.pathname === p : location.pathname.startsWith(p);

  const currentPage = MENU.find(i => isActive(i.path, i.exact))?.label ?? 'Administration';
  const visibleMenu = MENU.filter(i => !i.adminOnly || isAdmin);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* ── Overlay mobile ─────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gray-950 text-white
        flex flex-col flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-white/5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
            <CameraIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold tracking-tight text-white truncate">SanohPhoto</p>
            <p className="text-[10px] text-gray-500">Administration</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Fermer le menu"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Menu</p>
          <div className="space-y-0.5">
            {visibleMenu.map(({ path, label, Icon, exact }) => {
              const active = isActive(path, exact);
              return (
                <Link key={path} to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User + actions */}
        <div className="p-3 border-t border-white/5 flex-shrink-0 space-y-2">
          <Link to="/profile"
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </Link>
          <div className="flex gap-2">
            <Link to="/"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
            >
              <HomeIcon className="w-3.5 h-3.5" />Site
            </Link>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-3.5 h-3.5" />Quitter
            </button>
          </div>
        </div>
      </aside>

      {/* ── Zone principale ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50 dark:bg-gray-900">

        {/* Header */}
        <header className="flex-shrink-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 z-30">
          {/* Hamburger mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Titre page courante */}
          <h1 className="flex-1 text-sm font-semibold text-gray-900 dark:text-white truncate">
            {currentPage}
          </h1>

          {/* Actions droite */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/admin/messages')}
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={total > 0 ? \`\${total} notification(s)\` : 'Notifications'}
            >
              <BellIcon className={`w-5 h-5 \${total > 0 ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}\`} />
              {total > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                  {total > 99 ? '99+' : total}
                </span>
              )}
            </button>
            <Link to="/profile"
              className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold hover:scale-105 transition-transform"
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Link>
          </div>
        </header>

        {/* Contenu scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0 bg-gray-50 dark:bg-gray-900">
          <Notification />
          <Outlet />
        </main>
      </div>

      {/* ── Bottom Tab Bar mobile ─────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div
          className="grid gap-0"
          style={{ gridTemplateColumns: `repeat(${BOTTOM_TABS.length}, 1fr)` }}
        >
          {BOTTOM_TABS.map(({ path, label, Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link key={path} to={path}
                className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95 min-h-[56px] ${
                  active
                    ? 'text-amber-500'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${
                  active ? 'bg-amber-50 dark:bg-amber-500/10' : ''
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-medium leading-none ${
                  active ? 'font-semibold' : ''
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
