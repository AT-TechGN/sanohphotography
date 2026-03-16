import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';
import userService from '../services/userService';
import {
  UserCircleIcon, PencilIcon, KeyIcon, TrashIcon,
  CheckIcon, XMarkIcon, CameraIcon,
  ShieldCheckIcon, CalendarDaysIcon, EnvelopeIcon,
  PhoneIcon, ArrowLeftIcon,
} from '@heroicons/react/24/outline';

/* ─────────────────────────────────────────────────────────────────────────────
   ProfilePage — Consultation + CRUD profil utilisateur
   Design : carte glass morphism sur fond sombre ambré
───────────────────────────────────────────────────────────────────────────── */

const ROLE_LABELS = {
  ROLE_ADMIN:       { label: 'Administrateur', color: 'bg-red-500',    emoji: '🔑' },
  ROLE_PHOTOGRAPHE: { label: 'Photographe',    color: 'bg-amber-500', emoji: '📷' },
  ROLE_EMPLOYE:     { label: 'Employé',        color: 'bg-blue-500',   emoji: '💼' },
  ROLE_EMPLOYEE:    { label: 'Employé',        color: 'bg-blue-500',   emoji: '💼' },
  ROLE_CLIENT:      { label: 'Client',         color: 'bg-amber-500',  emoji: '👤' },
};

const getRoleInfo = (roles = []) => {
  for (const r of ['ROLE_ADMIN','ROLE_PHOTOGRAPHE','ROLE_EMPLOYE','ROLE_EMPLOYEE','ROLE_CLIENT']) {
    if (roles.includes(r)) return ROLE_LABELS[r];
  }
  return { label: 'Utilisateur', color: 'bg-gray-500', emoji: '👤' };
};

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-amber-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white font-medium truncate">{value || '—'}</p>
    </div>
  </div>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuthStore();
  const { showSuccess, showError } = useUIStore();

  const [profile,    setProfile]    = useState(user);
  const [loading,    setLoading]    = useState(false);
  const [activeTab,  setActiveTab]  = useState('info'); // 'info' | 'edit' | 'password' | 'delete'

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
  });
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [deleteForm, setDeleteForm] = useState({ password: '' });
  const [showDelete, setShowDelete] = useState(false);

  // Charger le profil frais depuis l'API
  const loadProfile = useCallback(async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setForm({ firstName: data.firstName || '', lastName: data.lastName || '', phone: data.phone || '' });
    } catch {
      // Si erreur, utiliser les données du store
      if (user) {
        setProfile(user);
        setForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' });
      }
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Mettre à jour le profil ────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      showError('Prénom et nom requis');
      return;
    }
    setLoading(true);
    try {
      const res = await userService.updateProfile(form);
      setProfile(res.user);
      await refreshUser();
      showSuccess('Profil mis à jour !');
      setActiveTab('info');
    } catch (err) {
      showError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  // ── Changer mot de passe ───────────────────────────────────────────────────
  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      showError('Les mots de passe ne correspondent pas');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      showError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      await userService.updateProfile({
        currentPassword: pwdForm.currentPassword,
        newPassword:     pwdForm.newPassword,
      });
      showSuccess('Mot de passe changé !');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('info');
    } catch (err) {
      showError(err.response?.data?.error || 'Erreur changement mot de passe');
    } finally {
      setLoading(false);
    }
  };

  // ── Supprimer le compte ────────────────────────────────────────────────────
  const handleDelete = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.deleteAccount(deleteForm.password);
      logout();
      navigate('/');
      showSuccess('Compte supprimé');
    } catch (err) {
      showError(err.response?.data?.error || 'Erreur suppression compte');
    } finally {
      setLoading(false);
    }
  };

  const roleInfo = getRoleInfo(profile?.roles);
  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`;

  const tabs = [
    { id: 'info',     label: 'Profil',         Icon: UserCircleIcon },
    { id: 'edit',     label: 'Modifier',        Icon: PencilIcon     },
    { id: 'password', label: 'Mot de passe',    Icon: KeyIcon        },
    { id: 'delete',   label: 'Supprimer',       Icon: TrashIcon,     danger: true },
  ];

  return (
    <div className="min-h-screen bg-gray-950 pt-16 md:pt-0">
      {/* ── Fond ambré décoratif ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-3 sm:px-4 py-6 md:py-12">
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Retour
        </button>

        {/* ── Avatar + nom ─────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-amber-500/30 mx-auto">
              {initials || <UserCircleIcon className="w-14 h-14" />}
            </div>
            <button
              onClick={() => setActiveTab('edit')}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <CameraIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {profile?.firstName} {profile?.lastName}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{profile?.email}</p>
          <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-white text-xs font-semibold ${roleInfo.color}`}>
            {roleInfo.emoji} {roleInfo.label}
          </span>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-white/5 backdrop-blur-sm rounded-2xl mb-6 overflow-x-auto">
          {tabs.map(({ id, label, Icon, danger }) => (
            <button key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? danger
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                  : danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Contenu des tabs ─────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <Motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            {/* ── Onglet INFO ──────────────────────────────────────── */}
            {activeTab === 'info' && (
              <div>
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-amber-400" />
                  Informations du compte
                </h2>
                <Field icon={UserCircleIcon} label="Prénom"       value={profile?.firstName} />
                <Field icon={UserCircleIcon} label="Nom"          value={profile?.lastName}  />
                <Field icon={EnvelopeIcon}   label="Email"        value={profile?.email}     />
                <Field icon={PhoneIcon}      label="Téléphone"    value={profile?.phone}     />
                <Field icon={CalendarDaysIcon} label="Membre depuis" value={
                  profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'
                } />
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Rôles</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.roles ?? []).filter(r => r !== 'ROLE_USER').map(r => (
                      <span key={r} className={`px-2 py-1 rounded-lg text-white text-xs font-medium ${ROLE_LABELS[r]?.color ?? 'bg-gray-600'}`}>
                        {ROLE_LABELS[r]?.emoji} {ROLE_LABELS[r]?.label ?? r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Onglet EDIT ──────────────────────────────────────── */}
            {activeTab === 'edit' && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <PencilIcon className="w-5 h-5 text-amber-400" />
                  Modifier le profil
                </h2>
                {[
                  { key: 'firstName', label: 'Prénom',     placeholder: 'Votre prénom' },
                  { key: 'lastName',  label: 'Nom',        placeholder: 'Votre nom'    },
                  { key: 'phone',     label: 'Téléphone',  placeholder: '+224 6XX XX XX XX' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setActiveTab('info')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-sm transition-colors">
                    <XMarkIcon className="w-4 h-4" />Annuler
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm shadow-lg shadow-amber-500/30 disabled:opacity-50 transition-all">
                    <CheckIcon className="w-4 h-4" />
                    {loading ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Onglet PASSWORD ──────────────────────────────────── */}
            {activeTab === 'password' && (
              <form onSubmit={handlePassword} className="space-y-4">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <KeyIcon className="w-5 h-5 text-amber-400" />
                  Changer le mot de passe
                </h2>
                {[
                  { key: 'currentPassword', label: 'Mot de passe actuel',     type: 'password' },
                  { key: 'newPassword',     label: 'Nouveau mot de passe',    type: 'password' },
                  { key: 'confirmPassword', label: 'Confirmer le nouveau',    type: 'password' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={pwdForm[key]}
                      onChange={e => setPwdForm({ ...pwdForm, [key]: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                ))}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-amber-400 text-xs">Minimum 6 caractères</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setActiveTab('info')}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-sm transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm shadow-lg shadow-amber-500/30 disabled:opacity-50 transition-all">
                    {loading ? 'Modification…' : 'Modifier'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Onglet DELETE ────────────────────────────────────── */}
            {activeTab === 'delete' && (
              <div>
                <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <TrashIcon className="w-5 h-5 text-red-400" />
                  Supprimer le compte
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                </p>
                {!showDelete ? (
                  <button
                    onClick={() => setShowDelete(true)}
                    className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors">
                    Je veux supprimer mon compte
                  </button>
                ) : (
                  <form onSubmit={handleDelete} className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <p className="text-red-400 text-sm font-medium mb-3">⚠️ Confirmez avec votre mot de passe</p>
                      <input
                        type="password"
                        value={deleteForm.password}
                        onChange={e => setDeleteForm({ password: e.target.value })}
                        placeholder="Mot de passe"
                        className="w-full px-4 py-3 bg-white/5 border border-red-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setShowDelete(false)}
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-sm transition-colors">
                        Annuler
                      </button>
                      <button type="submit" disabled={loading || !deleteForm.password}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm disabled:opacity-50 transition-all">
                        {loading ? 'Suppression…' : 'Supprimer définitivement'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </Motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage;
