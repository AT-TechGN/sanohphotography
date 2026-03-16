import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { useState, useEffect } from 'react';
import DarkModeToggle from './DarkModeToggle';
import {
  CameraIcon, CalendarIcon,
  HomeIcon, PhotoIcon, WrenchScrewdriverIcon,
  UserCircleIcon, ArrowRightOnRectangleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

/* ─────────────────────────────────────────────────────────────────────────────
   Navbar — responsive avec bottom tab bar sur mobile (≤ md)
   Desktop : navbar horizontale classique
   Mobile  : barre fixe en bas avec tabs (pattern iOS/Android natif)
───────────────────────────────────────────────────────────────────────────── */

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const isStaff = user?.roles?.some(r =>
    ['ROLE_ADMIN', 'ROLE_PHOTOGRAPHE', 'ROLE_EMPLOYE', 'ROLE_EMPLOYEE'].includes(r)
  );

  const baseBg = scrolled
    ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-sm'
    : isHomePage ? 'bg-transparent' : 'bg-white dark:bg-gray-950';
  const txtCls = !scrolled && isHomePage ? 'text-white' : 'text-gray-900 dark:text-white';
  const hvrCls = !scrolled && isHomePage ? 'hover:text-white/70' : 'hover:text-amber-500';

  // ── Tabs mobile (bottom navigation) ───────────────────────────────────────
  const mobileTabs = [
    { to: '/',        label: 'Accueil',  Icon: HomeIcon },
    { to: '/gallery', label: 'Galerie',  Icon: PhotoIcon },
    { to: '/services',label: 'Services', Icon: WrenchScrewdriverIcon },
    ...(isAuthenticated
      ? [{ to: isStaff ? '/admin' : '/dashboard', label: isStaff ? 'Admin' : 'Mon espace', Icon: isStaff ? Squares2X2Icon : UserCircleIcon }]
      : [{ to: '/login', label: 'Connexion', Icon: UserCircleIcon }]
    ),
    { to: '/booking', label: 'Réserver', Icon: CalendarIcon, cta: true },
  ];

  const isTabActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <>
      {/* ── Desktop Navbar ─────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${baseBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center transition-all ${scrolled ? 'h-14' : 'h-16'}`}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                <CameraIcon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-lg font-bold tracking-tight ${txtCls}`}>
                Sanoh<span className="text-amber-500">Photo</span>
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              <DarkModeToggle />
              {[
                { to: '/',         label: 'Accueil' },
                { to: '/gallery',  label: 'Galerie' },
                { to: '/services', label: 'Services' },
              ].map(({ to, label }) => (
                <Link key={to} to={to}
                  className={`text-sm font-medium transition-colors ${txtCls} ${hvrCls} ${
                    isTabActive(to) ? 'text-amber-500 font-semibold' : ''
                  }`}>
                  {label}
                </Link>
              ))}

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link to={isStaff ? '/admin' : '/dashboard'}
                    className={`text-sm font-medium transition-colors ${txtCls} ${hvrCls}`}>
                    {isStaff ? 'Administration' : 'Mon espace'}
                  </Link>
                  <Link to="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-amber-500/20 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <span className={`text-sm font-medium ${txtCls}`}>{user?.firstName}</span>
                  </Link>
                  <button onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
                    title="Déconnexion">
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className={`text-sm font-medium transition-colors ${txtCls} ${hvrCls}`}>
                    Connexion
                  </Link>
                  <Link to="/booking"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 transition-all">
                    <CalendarIcon className="w-4 h-4" />
                    Réserver
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile — juste le logo + DarkMode, tabs en bas */}
            <div className="md:hidden flex items-center gap-2">
              <DarkModeToggle />
              {isAuthenticated && (
                <Link to="/profile">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Tab Bar ───────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 safe-area-pb">
        <div className="flex">
          {mobileTabs.map(({ to, label, Icon, cta }) => {
            const active = isTabActive(to);
            return (
              <Link key={to} to={to}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95 ${
                  cta
                    ? 'relative'
                    : active
                    ? 'text-amber-500'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}>
                {cta ? (
                  <div className="absolute -top-5 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-semibold text-amber-500 mt-1">{label}</span>
                  </div>
                ) : (
                  <>
                    <div className={`relative p-1 rounded-xl transition-all ${active ? 'bg-amber-50 dark:bg-amber-500/10' : ''}`}>
                      <Icon className="w-5 h-5" />
                      {active && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />}
                    </div>
                    <span className={`text-[10px] font-medium leading-none ${active ? 'text-amber-500 font-semibold' : ''}`}>
                      {label}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer pour le bottom tab bar sur mobile */}
      <div className="md:hidden h-16 safe-area-pb" />
    </>
  );
};

export default Navbar;
