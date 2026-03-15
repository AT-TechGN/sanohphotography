import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import bookingService from '../services/bookingService';
import invoiceService from '../services/invoiceService';
import reviewService from '../services/reviewService';
import galleryService from '../services/galleryService';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';
import Loading from '../components/common/Loading';
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  PhotoIcon,
  StarIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CameraIcon,
  BellIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// ─── Constantes ───────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed:   'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed:   'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400',
  cancelled:   'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400',
};
const STATUS_LABELS = {
  pending:     'En attente',
  confirmed:   'Confirmée',
  in_progress: 'En cours',
  completed:   'Terminée',
  cancelled:   'Annulée',
};
const STATUS_ICONS = {
  pending:     ClockIcon,
  confirmed:   CheckCircleIcon,
  in_progress: CameraIcon,
  completed:   CheckCircleIcon,
  cancelled:   XCircleIcon,
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ─── Composant principal ──────────────────────────────────────────────────────
const ClientDashboard = () => {
  const navigate          = useNavigate();
  const { user }          = useAuthStore();
  const { showSuccess, showError } = useUIStore();

  const [activeTab,  setActiveTab]  = useState('overview');
  const [bookings,   setBookings]   = useState([]);
  const [invoices,   setInvoices]   = useState([]);
  const [albums,     setAlbums]     = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Formulaire avis
  const [reviewModal,  setReviewModal]  = useState(null); // booking | null
  const [reviewForm,   setReviewForm]   = useState({ rating: 5, comment: '' });
  const [submitting,   setSubmitting]   = useState(false);

  const tabs = [
    { id: 'overview',  label: 'Accueil',       icon: UserIcon          },
    { id: 'bookings',  label: 'Réservations',  icon: CalendarDaysIcon  },
    { id: 'invoices',  label: 'Factures',      icon: DocumentTextIcon  },
    { id: 'photos',    label: 'Mes Photos',    icon: PhotoIcon         },
  ];

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsData, invoicesData] = await Promise.all([
        bookingService.getMyBookings(),
        invoiceService.getMyInvoices(),
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);

      // Albums publics (galerie client)
      try {
        const albumsRes = await galleryService.getAlbums(1, 6);
        const raw = Array.isArray(albumsRes) ? albumsRes : (albumsRes?.data ?? []);
        setAlbums(raw);
      } catch {
        // albums optionnels — on ignore l'erreur
      }
    } catch (err) {
      console.error('Erreur chargement données client:', err);
      showError('Erreur lors du chargement de vos données');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Télécharger facture ─────────────────────────────────────────────────────
  const handleDownloadInvoice = async (id, number) => {
    try {
      const blob = await invoiceService.downloadPdf(id);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `facture-${number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Facture téléchargée');
    } catch (err) {
      console.error(err);
      showError('Erreur téléchargement');
    }
  };

  // ── Soumettre avis ──────────────────────────────────────────────────────────
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await reviewService.submit({
        booking_id: reviewModal.id,
        rating:     reviewForm.rating,
        comment:    reviewForm.comment,
      });
      showSuccess('Votre avis a été soumis, merci !');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      console.error(err);
      showError('Erreur lors de la soumission de l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers d'affichage ─────────────────────────────────────────────────────
  const formatPrice = (v) =>
    new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(v);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const StatusBadge = ({ status }) => {
    const Icon = STATUS_ICONS[status] || ClockIcon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
        <Icon className="w-3.5 h-3.5" />
        {STATUS_LABELS[status] || status}
      </span>
    );
  };

  // ── Stats rapides ───────────────────────────────────────────────────────────
  const upcomingBookings   = bookings.filter(b => ['pending','confirmed'].includes(b.status));
  const completedBookings  = bookings.filter(b => b.status === 'completed');
  const pendingInvoices    = invoices.filter(i => i.status === 'pending');
  const totalSpent         = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);

  if (loading) return <Loading fullScreen text="Chargement de votre espace..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-purple-200 text-sm mb-1">Bienvenue dans votre espace</p>
              <h1 className="text-3xl md:text-4xl font-bold">
                Bonjour, {user?.firstName} ! 👋
              </h1>
              <p className="text-purple-200 mt-2">
                {upcomingBookings.length > 0
                  ? `Vous avez ${upcomingBookings.length} réservation(s) à venir`
                  : 'Aucune réservation à venir'}
              </p>
            </div>
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors shadow-lg self-start md:self-auto"
            >
              <PlusIcon className="w-5 h-5" />
              Nouvelle réservation
            </Link>
          </Motion.div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Réservations à venir', value: upcomingBookings.length,  color: 'bg-white/10' },
              { label: 'Séances réalisées',    value: completedBookings.length, color: 'bg-white/10' },
              { label: 'Factures en attente',  value: pendingInvoices.length,   color: 'bg-white/10' },
              { label: 'Total dépensé',        value: formatPrice(totalSpent),  color: 'bg-white/10' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} backdrop-blur-sm rounded-xl p-4`}>
                <p className="text-purple-200 text-xs mb-1">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.id === 'bookings' && upcomingBookings.length > 0 && (
                    <span className="ml-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs px-2 py-0.5 rounded-full">
                      {upcomingBookings.length}
                    </span>
                  )}
                  {tab.id === 'invoices' && pendingInvoices.length > 0 && (
                    <span className="ml-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                      {pendingInvoices.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Motion.div key={activeTab} initial="hidden" animate="visible" variants={fadeUp}>

          {/* ── Overview ─────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Actions rapides */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Actions rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/booking" className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <CalendarDaysIcon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg mb-1">Réserver une séance</h3>
                    <p className="text-purple-100 text-sm">Choisissez votre service et votre créneau</p>
                    <ArrowRightIcon className="w-5 h-5 mt-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/gallery" className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <PhotoIcon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg mb-1">Voir la galerie</h3>
                    <p className="text-pink-100 text-sm">Découvrez nos dernières réalisations</p>
                    <ArrowRightIcon className="w-5 h-5 mt-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all group text-left"
                  >
                    <BellIcon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg mb-1">Mes réservations</h3>
                    <p className="text-cyan-100 text-sm">
                      {upcomingBookings.length > 0 ? `${upcomingBookings.length} séance(s) à venir` : 'Aucune séance à venir'}
                    </p>
                    <ArrowRightIcon className="w-5 h-5 mt-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Prochaines séances */}
              {upcomingBookings.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Prochaines séances</h2>
                    <button onClick={() => setActiveTab('bookings')} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                      Voir tout
                    </button>
                  </div>
                  <div className="space-y-3">
                    {upcomingBookings.slice(0, 3).map((booking) => (
                      <BookingCard key={booking.id} booking={booking} onReview={setReviewModal} formatDate={formatDate} StatusBadge={StatusBadge} />
                    ))}
                  </div>
                </div>
              )}

              {/* Factures en attente */}
              {pendingInvoices.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Factures en attente
                      <span className="ml-2 text-base font-normal text-yellow-600 dark:text-yellow-400">({pendingInvoices.length})</span>
                    </h2>
                    <button onClick={() => setActiveTab('invoices')} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                      Voir tout
                    </button>
                  </div>
                  <div className="space-y-3">
                    {pendingInvoices.slice(0, 2).map((invoice) => (
                      <InvoiceCard key={invoice.id} invoice={invoice} formatPrice={formatPrice} formatDate={formatDate} onDownload={handleDownloadInvoice} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Réservations ─────────────────────────────────────────── */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mes réservations</h2>
                <Link to="/booking" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm">
                  <PlusIcon className="w-4 h-4" /> Nouvelle
                </Link>
              </div>

              {bookings.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                  <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucune réservation</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Réservez votre première séance photo</p>
                  <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                    <PlusIcon className="w-5 h-5" /> Réserver maintenant
                  </Link>
                </div>
              ) : (
                bookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} onReview={setReviewModal} formatDate={formatDate} StatusBadge={StatusBadge} expanded />
                ))
              )}
            </div>
          )}

          {/* ── Factures ─────────────────────────────────────────────── */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mes factures</h2>

              {invoices.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                  <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune facture disponible</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <InvoiceCard key={invoice.id} invoice={invoice} formatPrice={formatPrice} formatDate={formatDate} onDownload={handleDownloadInvoice} expanded />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Photos ───────────────────────────────────────────────── */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Galerie & Albums</h2>

              {albums.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                  <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun album disponible</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Vos photos apparaîtront ici après votre séance</p>
                  <Link to="/gallery" className="text-purple-600 dark:text-purple-400 hover:underline text-sm">
                    Voir la galerie publique →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {albums.map((album) => (
                    <div key={album.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
                      <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center relative">
                        {album.coverPhoto ? (
                          <img src={album.coverPhoto} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <PhotoIcon className="w-16 h-16 text-purple-300 dark:text-purple-600" />
                        )}
                        {album.isPublic && (
                          <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">Public</span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{album.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{album.photosCount ?? 0} photo(s)</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </Motion.div>
      </div>

      {/* ── Modal avis ──────────────────────────────────────────────────── */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Laisser un avis</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Pour : <span className="text-purple-600 font-medium">{reviewModal.service?.name}</span>
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-5">
              {/* Étoiles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Note</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                      className="transition-transform hover:scale-110"
                    >
                      {star <= reviewForm.rating
                        ? <StarSolidIcon className="w-8 h-8 text-yellow-400" />
                        : <StarIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      }
                    </button>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Commentaire *
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                  rows="4"
                  placeholder="Partagez votre expérience..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Envoyer'}
                </button>
                <button
                  type="button"
                  onClick={() => { setReviewModal(null); setReviewForm({ rating: 5, comment: '' }); }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </Motion.div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const BookingCard = ({ booking, onReview, formatDate, StatusBadge, expanded = false }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all p-5">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
            <CameraIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{booking.service?.name}</h3>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div className="ml-13 space-y-1 text-sm text-gray-600 dark:text-gray-400 mt-2">
          <p className="flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 flex-shrink-0" />
            {booking.scheduledDate ? formatDate(booking.scheduledDate) : '—'}
            {booking.scheduledTime && ` à ${booking.scheduledTime}`}
          </p>
          {booking.service?.durationMin && (
            <p className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 flex-shrink-0" />
              {booking.service.durationMin} min
            </p>
          )}
          {booking.assignedEmployee && (
            <p className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 flex-shrink-0" />
              {booking.assignedEmployee.firstName} {booking.assignedEmployee.lastName}
            </p>
          )}
          {expanded && booking.notes && (
            <p className="text-gray-500 dark:text-gray-400 italic mt-2">"{booking.notes}"</p>
          )}
        </div>
      </div>

      {/* Action : laisser un avis si séance terminée */}
      {booking.status === 'completed' && (
        <button
          onClick={() => onReview(booking)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-xl font-medium hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-sm flex-shrink-0"
        >
          <StarIcon className="w-4 h-4" />
          Laisser un avis
        </button>
      )}
    </div>
  </div>
);

const InvoiceCard = ({ invoice, formatPrice, formatDate, onDownload, expanded = false }) => {
  const statusMap = {
    pending:   { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'En attente' },
    paid:      { color: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400',  label: 'Payée'     },
    cancelled: { color: 'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400',    label: 'Annulée'   },
  };
  const { color, label } = statusMap[invoice.status] || statusMap.pending;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <DocumentTextIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-white">{invoice.invoiceNumber}</p>
            {expanded && invoice.issuedAt && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(invoice.issuedAt)}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="font-bold text-lg text-gray-900 dark:text-white">{formatPrice(invoice.amount)}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
          </div>
          <button
            onClick={() => onDownload(invoice.id, invoice.invoiceNumber)}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Télécharger PDF"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
