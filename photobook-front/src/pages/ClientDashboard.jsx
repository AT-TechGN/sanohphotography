import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import bookingService  from '../services/bookingService';
import invoiceService  from '../services/invoiceService';
import reviewService   from '../services/reviewService';
import useAuthStore    from '../stores/authStore';
import useUIStore      from '../stores/uiStore';
import Loading         from '../components/common/Loading';
import {
  CalendarDaysIcon, DocumentTextIcon, PhotoIcon, UserCircleIcon,
  PlusIcon, ArrowDownTrayIcon, ClockIcon, CheckCircleIcon,
  XCircleIcon, CameraIcon, StarIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const STATUS = {
  pending:     { label: 'En attente',  cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Icon: ClockIcon        },
  confirmed:   { label: 'Confirmée',   cls: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',   Icon: CheckCircleIcon  },
  in_progress: { label: 'En cours',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', Icon: CameraIcon       },
  completed:   { label: 'Terminée',    cls: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',  Icon: CheckCircleIcon  },
  cancelled:   { label: 'Annulée',     cls: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',    Icon: XCircleIcon      },
};

const TABS = [
  { id: 'overview',  label: 'Accueil',       Icon: UserCircleIcon   },
  { id: 'bookings',  label: 'Réservations',  Icon: CalendarDaysIcon },
  { id: 'invoices',  label: 'Factures',      Icon: DocumentTextIcon },
  { id: 'photos',    label: 'Photos',        Icon: PhotoIcon        },
];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();
  const { showSuccess, showError } = useUIStore();

  const [tab,      setTab]      = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm,  setReviewForm]  = useState({ rating: 5, comment: '' });
  const [submitting,  setSubmitting]  = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [b, i] = await Promise.all([
        bookingService.getMyBookings().catch(() => []),
        invoiceService.getMyInvoices().catch(() => []),
      ]);
      setBookings(Array.isArray(b) ? b : []);
      setInvoices(Array.isArray(i) ? i : []);
    } catch { showError('Erreur chargement données'); }
    finally { setLoading(false); }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) { showError('Commentaire requis'); return; }
    setSubmitting(true);
    try {
      await reviewService.submit({
        bookingId: reviewModal.id,
        rating:    reviewForm.rating,
        comment:   reviewForm.comment,
        content:   reviewForm.comment,
      });
      showSuccess('Avis envoyé, merci !');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch { showError('Erreur envoi avis'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Loading fullScreen text="Chargement…" />;

  const pending   = bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const completed = bookings.filter(b => b.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ── Header coloré ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-900 pt-20 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto relative">
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-amber-500/30 flex-shrink-0">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </Link>
            <div>
              <p className="text-amber-400 text-sm font-medium">Bonjour 👋</p>
              <h1 className="text-2xl font-bold text-white">{user?.firstName} {user?.lastName}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'En attente', value: pending,   color: 'text-yellow-400' },
              { label: 'Confirmées', value: confirmed, color: 'text-blue-400'   },
              { label: 'Terminées',  value: completed, color: 'text-green-400'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-gray-400 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Card principale avec tabs ─────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-10 pb-24">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
          {/* Tabs — scrollable horizontal sur mobile */}
          <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto scrollbar-none">
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button key={id}
                  onClick={() => setTab(id)}
                  className={`flex-1 min-w-[80px] flex flex-col items-center gap-1 py-4 px-2 text-xs font-semibold transition-all border-b-2 whitespace-nowrap ${
                    active
                      ? 'border-amber-500 text-amber-500 bg-amber-50 dark:bg-amber-500/5'
                      : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}>
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Contenu */}
          <AnimatePresence mode="wait">
            <Motion.div
              key={tab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-6"
            >
              {/* ── OVERVIEW ─────────────────────────────────────── */}
              {tab === 'overview' && (
                <div className="space-y-4">
                  <Link to="/booking"
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl text-white group hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                    <div>
                      <p className="font-bold text-lg">Nouvelle réservation</p>
                      <p className="text-amber-100 text-sm">Réservez votre séance photo</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlusIcon className="w-6 h-6" />
                    </div>
                  </Link>

                  {bookings.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Dernières réservations</h3>
                        <button onClick={() => setTab('bookings')} className="text-amber-500 text-xs font-medium flex items-center gap-1 hover:text-amber-600">
                          Tout voir <ArrowRightIcon className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {bookings.slice(0, 3).map(b => {
                          const s = STATUS[b.status] ?? STATUS.pending;
                          const SIcon = s.Icon;
                          return (
                            <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                <CameraIcon className="w-5 h-5 text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.service?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('fr-FR') : '—'}
                                  {b.scheduledTime ? ` · ${b.scheduledTime}` : ''}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${s.cls}`}>
                                <SIcon className="w-3 h-3" />{s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Link to="/profile"
                    className="flex items-center gap-3 p-4 border border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Mon profil</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gérer mes informations</p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
                  </Link>
                </div>
              )}

              {/* ── BOOKINGS ─────────────────────────────────────── */}
              {tab === 'bookings' && (
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune réservation</p>
                      <Link to="/booking"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-400 transition-colors">
                        <PlusIcon className="w-4 h-4" />Réserver maintenant
                      </Link>
                    </div>
                  ) : bookings.map(b => {
                    const s = STATUS[b.status] ?? STATUS.pending;
                    const SIcon = s.Icon;
                    return (
                      <div key={b.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:border-amber-200 dark:hover:border-amber-500/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{b.service?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              📅 {b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
                              {b.scheduledTime ? ` · 🕐 ${b.scheduledTime}` : ''}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 flex-shrink-0 ${s.cls}`}>
                            <SIcon className="w-3 h-3" />{s.label}
                          </span>
                        </div>
                        {b.totalPrice && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            💰 {new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(b.totalPrice)}
                          </p>
                        )}
                        {b.status === 'completed' && (
                          <button
                            onClick={() => { setReviewModal(b); setReviewForm({ rating: 5, comment: '' }); }}
                            className="mt-3 w-full py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5">
                            <StarIcon className="w-3.5 h-3.5" />Laisser un avis
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── INVOICES ─────────────────────────────────────── */}
              {tab === 'invoices' && (
                <div className="space-y-3">
                  {invoices.length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">Aucune facture</p>
                    </div>
                  ) : invoices.map(inv => (
                    <div key={inv.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <DocumentTextIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Facture #{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {inv.amountTtc
                            ? new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(inv.amountTtc)
                            : '—'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status === 'paid' ? 'Payée' : 'En attente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── PHOTOS ───────────────────────────────────────── */}
              {tab === 'photos' && (
                <div className="text-center py-12">
                  <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">Vos photos seront disponibles ici</p>
                  <p className="text-xs text-gray-400">Après votre séance, le photographe partagera vos photos</p>
                  <Link to="/gallery" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-400 transition-colors">
                    Voir la galerie
                  </Link>
                </div>
              )}
            </Motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modal avis ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {reviewModal && (
          <Motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setReviewModal(null)}>
            <Motion.div
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Laisser un avis</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">{reviewModal.service?.name}</p>
              
              {/* Étoiles */}
              <div className="flex justify-center gap-2 mb-5">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                    className="transition-transform hover:scale-110 active:scale-95">
                    {n <= reviewForm.rating
                      ? <StarSolidIcon className="w-9 h-9 text-amber-400" />
                      : <StarIcon className="w-9 h-9 text-gray-300" />
                    }
                  </button>
                ))}
              </div>
              
              <textarea
                rows={3}
                value={reviewForm.comment}
                onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Partagez votre expérience…"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setReviewModal(null)}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm">
                  Annuler
                </button>
                <button onClick={submitReview} disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-all">
                  {submitting ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
