import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { useState, useEffect } from 'react';
import DarkModeToggle from './DarkModeToggle';
import { CameraIcon, Bars3Icon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fermer le menu mobile quand la route change
  useEffect(() => {
    // close mobile menu after route change without calling setState synchronously
    if (mobileMenuOpen) {
      const t = setTimeout(() => setMobileMenuOpen(false), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [location.pathname, mobileMenuOpen]);

  const baseBgClass = scrolled
    ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm'
    : isHomePage
    ? 'bg-transparent'
    : 'bg-white dark:bg-gray-900';

  const textClass = !scrolled && isHomePage
    ? 'text-white'
    : 'text-gray-900 dark:text-white';

  const hoverClass = !scrolled && isHomePage
    ? 'hover:text-white/80'
    : 'hover:text-purple-600 dark:hover:text-purple-400';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${baseBgClass} border-b border-gray-200 dark:border-gray-800`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${scrolled ? 'h-14' : 'h-16'}`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <CameraIcon className="w-5 h-5 text-white" />
            </div>
            <span className={`text-lg font-bold ${textClass}`}>
              Sanoh<span className="text-purple-600">Photo</span>
            </span>
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <DarkModeToggle />
            <Link to="/" className={`text-sm font-medium ${textClass} ${hoverClass} transition-colors`}>
              Accueil
            </Link>
            <Link to="/gallery" className={`text-sm font-medium ${textClass} ${hoverClass} transition-colors`}>
              Galerie
            </Link>
            <Link to="/services" className={`text-sm font-medium ${textClass} ${hoverClass} transition-colors`}>
              Services
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link 
                  to="/dashboard" 
                  className={`text-sm font-medium ${textClass} ${hoverClass} transition-colors`}
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${textClass}`}>
                    {user?.firstName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className={`text-sm font-medium ${textClass} ${hoverClass} transition-colors`}
                >
                  Connexion
                </Link>
                <Link
                  to="/booking"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all"
                >
                  <CalendarIcon className="w-4 h-4" />
                  Réserver
                </Link>
              </div>
            )}
          </div>

          {/* Bouton menu mobile */}
          <div className="md:hidden flex items-center gap-2">
            <DarkModeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${textClass}`}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-4 space-y-2">
            <Link
              to="/"
              className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
            >
              Accueil
            </Link>
            <Link
              to="/gallery"
              className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
            >
              Galerie
            </Link>
            <Link
              to="/services"
              className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
            >
              Services
            </Link>
            <Link
              to="/booking"
              className="block px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-center"
            >
              Réserver maintenant
            </Link>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-3 bg-purple-600 text-white rounded-lg font-medium text-center"
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

