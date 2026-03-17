import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';
import {
  CameraIcon, EnvelopeIcon, LockClosedIcon,
  EyeIcon, EyeSlashIcon, ArrowRightIcon,
  CheckCircleIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

/* ─── Champ de saisie stylé ─────────────────────────────────────────────── */
const Field = ({ label, id, icon: Icon, error, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest text-gray-400">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className={`w-4 h-4 ${error ? 'text-red-400' : 'text-gray-500'}`} />
      </div>
      {children}
    </div>
    <AnimatePresence>
      {error && (
        <Motion.p
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-1.5 text-xs text-red-400"
        >
          <ExclamationCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </Motion.p>
      )}
    </AnimatePresence>
  </div>
);

/* ─── Page Login ────────────────────────────────────────────────────────── */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const { showSuccess, showError } = useUIStore();

  const [form,         setForm]         = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors,       setErrors]       = useState({});
  const [success,      setSuccess]      = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
    if (!form.password) e.password = 'Mot de passe requis';
    else if (form.password.length < 6) e.password = 'Minimum 6 caractères';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await login(form);

    if (result.success) {
      setSuccess(true);
      showSuccess('Connexion réussie !');
      setTimeout(() => {
        const { user } = useAuthStore.getState();
        const roles = user?.roles ?? [];
        const isStaff = roles.some(r => ['ROLE_ADMIN', 'ROLE_PHOTOGRAPHE', 'ROLE_EMPLOYEE'].includes(r));
        navigate(isStaff ? '/admin' : '/dashboard');
      }, 600);
    } else {
      showError(result.error || 'Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col overflow-hidden">

      {/* ── Orbes décoratifs ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-amber-400/8 rounded-full blur-3xl" />
      </div>

      {/* ── Contenu centré ────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-12 pt-20 md:pt-12">

        {/* Logo + marque */}
        <Motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
              <CameraIcon className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Sanoh<span className="text-amber-400">Photo</span>
              </h1>
              <p className="text-xs text-gray-500 tracking-widest uppercase mt-0.5">Studio Professionnel</p>
            </div>
          </Link>
        </Motion.div>

        {/* Carte principale */}
        <Motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* Titre */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white">Bon retour 👋</h2>
            <p className="text-sm text-gray-400 mt-1">Connectez-vous pour continuer</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <Field label="Email" id="email" icon={EnvelopeIcon} error={errors.email}>
              <input
                id="email" name="email" type="email"
                value={form.email} onChange={handleChange}
                placeholder="vous@exemple.com"
                autoComplete="email" autoCapitalize="none"
                className={`w-full pl-11 pr-4 py-4 rounded-2xl bg-white/5 border text-white placeholder-gray-600 text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all
                  ${errors.email ? 'border-red-500/60' : 'border-white/10 hover:border-white/20'}`}
              />
            </Field>

            {/* Mot de passe */}
            <Field label="Mot de passe" id="password" icon={LockClosedIcon} error={errors.password}>
              <input
                id="password" name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full pl-11 pr-12 py-4 rounded-2xl bg-white/5 border text-white placeholder-gray-600 text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all
                  ${errors.password ? 'border-red-500/60' : 'border-white/10 hover:border-white/20'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword
                  ? <EyeSlashIcon className="w-4 h-4" />
                  : <EyeIcon className="w-4 h-4" />
                }
              </button>
            </Field>

            {/* Bouton soumettre */}
            <Motion.button
              type="submit"
              disabled={loading || success}
              whileHover={{ scale: loading || success ? 1 : 1.02 }}
              whileTap={{ scale: loading || success ? 1 : 0.97 }}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm
                transition-all mt-2 shadow-lg
                ${success
                  ? 'bg-green-500 shadow-green-500/30 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/30 text-white disabled:opacity-60'
                }`}
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <Motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" /> Connecté !
                  </Motion.span>
                ) : loading ? (
                  <Motion.span key="load" className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Connexion…
                  </Motion.span>
                ) : (
                  <Motion.span key="idle" className="flex items-center gap-2">
                    Se connecter <ArrowRightIcon className="w-4 h-4" />
                  </Motion.span>
                )}
              </AnimatePresence>
            </Motion.button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-gray-600">ou</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Lien inscription */}
          <p className="text-center text-sm text-gray-400">
            Pas encore de compte ?{' '}
            <Link
              to="/register"
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              Créer un compte
            </Link>
          </p>

          {/* Comptes de test — discrets */}
          <Motion.details
            className="mt-8 group"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >
            <summary className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer transition-colors text-center list-none flex items-center justify-center gap-1.5">
              <span>Comptes de démonstration</span>
              <span className="text-[10px] group-open:rotate-180 transition-transform inline-block">▾</span>
            </summary>
            <div className="mt-3 p-4 rounded-2xl bg-white/3 border border-white/8 space-y-2.5">
              {[
                { role: 'Admin',       email: 'admin@photobook.com',          pass: 'admin123',  color: 'text-red-400'    },
                { role: 'Photographe', email: 'photographe@photobook.com',    pass: 'photo123',  color: 'text-amber-400'  },
                { role: 'Client',      email: 'mamadou.diallo@example.com',   pass: 'client123', color: 'text-green-400'  },
              ].map(({ role, email, pass, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ email, password: pass })}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group/item"
                >
                  <span className={`text-xs font-semibold ${color}`}>{role}</span>
                  <span className="text-[10px] text-gray-600 font-mono group-hover/item:text-gray-400 transition-colors truncate ml-3">
                    {email}
                  </span>
                </button>
              ))}
            </div>
          </Motion.details>

        </Motion.div>
      </div>

      {/* ── Footer minimaliste ────────────────────────────────────── */}
      <Motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="relative z-10 text-center text-[11px] text-gray-700 pb-8"
      >
        © {new Date().getFullYear()} SanohPhoto · Conakry, Guinée
      </Motion.p>

    </div>
  );
};

export default LoginPage;
