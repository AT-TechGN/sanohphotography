import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';
import {
  CameraIcon, EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon,
  EyeIcon, EyeSlashIcon, ArrowRightIcon,
  CheckCircleIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

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
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex items-center gap-1.5 text-xs text-red-400"
        >
          <ExclamationCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />{error}
        </Motion.p>
      )}
    </AnimatePresence>
  </div>
);

const inputCls = (err) =>
  `w-full pl-11 pr-4 py-4 rounded-2xl bg-white/5 border text-white placeholder-gray-600 text-sm
   focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all
   ${err ? 'border-red-500/60' : 'border-white/10 hover:border-white/20'}`;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const { showSuccess, showError } = useUIStore();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPwd,  setShowPwd]  = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [success,  setSuccess]  = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Prénom requis';
    if (!form.lastName.trim())  e.lastName  = 'Nom requis';
    if (!form.email)            e.email     = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
    if (!form.password)         e.password  = 'Mot de passe requis';
    else if (form.password.length < 6) e.password = 'Minimum 6 caractères';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password });
    if (result.success) {
      setSuccess(true);
      showSuccess('Compte créé ! Connexion en cours…');
      setTimeout(() => navigate('/login'), 1000);
    } else {
      showError(result.error || 'Erreur lors de la création du compte');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-amber-500/12 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-12 pt-20 md:pt-12">

        {/* Logo */}
        <Motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center mb-7"
        >
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
              <CameraIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Sanoh<span className="text-amber-400">Photo</span></h1>
          </Link>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Créer un compte</h2>
            <p className="text-sm text-gray-400 mt-1">Rejoignez SanohPhoto dès aujourd'hui</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" id="firstName" icon={UserIcon} error={errors.firstName}>
                <input id="firstName" name="firstName" type="text" value={form.firstName}
                  onChange={handleChange} placeholder="Mamadou" autoComplete="given-name"
                  className={inputCls(errors.firstName)} />
              </Field>
              <Field label="Nom" id="lastName" icon={UserIcon} error={errors.lastName}>
                <input id="lastName" name="lastName" type="text" value={form.lastName}
                  onChange={handleChange} placeholder="Diallo" autoComplete="family-name"
                  className={inputCls(errors.lastName)} />
              </Field>
            </div>

            <Field label="Email" id="email" icon={EnvelopeIcon} error={errors.email}>
              <input id="email" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="vous@exemple.com" autoComplete="email"
                className={inputCls(errors.email)} />
            </Field>

            <Field label="Téléphone (optionnel)" id="phone" icon={PhoneIcon} error={errors.phone}>
              <input id="phone" name="phone" type="tel" value={form.phone}
                onChange={handleChange} placeholder="+224 6XX XX XX XX" autoComplete="tel"
                className={inputCls(errors.phone)} />
            </Field>

            <Field label="Mot de passe" id="password" icon={LockClosedIcon} error={errors.password}>
              <input id="password" name="password" type={showPwd ? 'text' : 'password'}
                value={form.password} onChange={handleChange} placeholder="••••••••"
                autoComplete="new-password" className={`${inputCls(errors.password)} pr-12`} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors">
                {showPwd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </Field>

            <Field label="Confirmer le mot de passe" id="confirmPassword" icon={LockClosedIcon} error={errors.confirmPassword}>
              <input id="confirmPassword" name="confirmPassword" type={showCPwd ? 'text' : 'password'}
                value={form.confirmPassword} onChange={handleChange} placeholder="••••••••"
                autoComplete="new-password" className={`${inputCls(errors.confirmPassword)} pr-12`} />
              <button type="button" onClick={() => setShowCPwd(v => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors">
                {showCPwd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </Field>

            <Motion.button
              type="submit" disabled={loading || success}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm mt-2 shadow-lg transition-all
                ${success
                  ? 'bg-green-500 shadow-green-500/30 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/30 text-white disabled:opacity-60'
                }`}
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <Motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" /> Compte créé !
                  </Motion.span>
                ) : loading ? (
                  <Motion.span key="load" className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Création…
                  </Motion.span>
                ) : (
                  <Motion.span key="idle" className="flex items-center gap-2">
                    Créer mon compte <ArrowRightIcon className="w-4 h-4" />
                  </Motion.span>
                )}
              </AnimatePresence>
            </Motion.button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-gray-600">ou</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <p className="text-center text-sm text-gray-400">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
              Se connecter
            </Link>
          </p>
        </Motion.div>
      </div>

      <Motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="relative z-10 text-center text-[11px] text-gray-700 pb-8"
      >
        © {new Date().getFullYear()} SanohPhoto · Conakry, Guinée
      </Motion.p>
    </div>
  );
};

export default RegisterPage;
