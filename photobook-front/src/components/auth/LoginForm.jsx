import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import useUIStore from '../../stores/uiStore';
import { CameraIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LoginForm = () => {
  const navigate    = useNavigate();
  const { login, loading } = useAuthStore();
  const { showSuccess, showError } = useUIStore();

  const [formData,     setFormData]     = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors,       setErrors]       = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await login(formData);

    if (result.success) {
      showSuccess('Connexion réussie !');

      // BUG CORRIGÉ : redirection fixe vers /dashboard causait un redirect loop
      // pour les admins/photographes (protégés par ROLE_CLIENT uniquement).
      // On lit les rôles depuis le store après login et on redirige correctement.
      const { user } = useAuthStore.getState();
      const roles = user?.roles ?? [];

      if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_PHOTOGRAPHE') || roles.includes('ROLE_EMPLOYEE')) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      showError(result.error || 'Erreur de connexion');
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 flex items-center justify-center">
              <CameraIcon className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Bon retour parmi nous</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email" id="email" name="email"
                value={formData.email} onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                placeholder="votre@email.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'} id="password" name="password"
                value={formData.password} onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {showPassword
                  ? <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  : <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                }
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-4 rounded-xl font-medium hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium">
              S'inscrire
            </Link>
          </p>
        </div>

        {/* Comptes de test */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Comptes de test :</p>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <p><strong>Admin:</strong> admin@photobook.com / admin123</p>
            <p><strong>Photographe:</strong> photographe@photobook.com / photo123</p>
            <p><strong>Client:</strong> mamadou.diallo@example.com / client123</p>
          </div>
        </div>
      </div>
    </Motion.div>
  );
};

export default LoginForm;
