import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import useBookingStore from '../../stores/bookingStore';
import useUIStore from '../../stores/uiStore';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * CORRECTIONS :
 * 1. getBookingData() dans bookingStore retournait scheduled_date/scheduled_time
 *    → Le backend attend ces noms de paramètres dans create() ✓ (c'est l'API qui mappe)
 * 2. Ajout gestion d'erreur détaillée (message du serveur affiché)
 * 3. Amélioration UX : message de succès plus clair, état de chargement
 */
const BookingStep5 = () => {
  const navigate = useNavigate();
  const {
    selectedService,
    selectedDate,
    selectedSlot,
    clientInfo,
    getBookingData,
    reset,
    previousStep,
  } = useBookingStore();

  const { showSuccess, showError } = useUIStore();
  const [loading,  setLoading]  = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const formatPrice = (price) =>
    new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(price);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const bookingData = getBookingData();
      await bookingService.create(bookingData);

      setConfirmed(true);
      showSuccess('Réservation créée avec succès !');

      setTimeout(() => {
        reset();
        navigate('/dashboard');
      }, 2500);
    } catch (err) {
      console.error('Erreur réservation:', err);
      // CORRECTION 2 : afficher le message d'erreur du serveur
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      showError(serverMsg || 'Erreur lors de la réservation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Réservation confirmée !</h2>
        <p className="text-gray-500 dark:text-gray-400">Vous allez être redirigé vers votre espace client…</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Étape 5 : Confirmation</h2>

      {/* Récapitulatif */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Récapitulatif de votre réservation</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-600 dark:text-gray-400">Service</span>
            <span className="font-medium text-gray-900 dark:text-white">{selectedService?.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-600 dark:text-gray-400">Date</span>
            <span className="font-medium text-gray-900 dark:text-white">{selectedDate ? formatDate(selectedDate) : '—'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-600 dark:text-gray-400">Heure</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedSlot?.startTime} — {selectedSlot?.endTime}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-600 dark:text-gray-400">Durée</span>
            <span className="font-medium text-gray-900 dark:text-white">{selectedService?.durationMin} minutes</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-600 dark:text-gray-400">Participants</span>
            <span className="font-medium text-gray-900 dark:text-white">{clientInfo.participants}</span>
          </div>
          {clientInfo.notes && (
            <div className="py-2 border-b border-gray-200 dark:border-gray-600">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Notes</p>
              <p className="text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                {clientInfo.notes}
              </p>
            </div>
          )}
          <div className="flex justify-between items-center pt-3">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
            <span className="text-2xl font-bold text-amber-600">
              {formatPrice(selectedService?.basePrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Infos importantes */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-8">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">Informations importantes</h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
              <li>• Votre réservation sera confirmée par le photographe sous 24h</li>
              <li>• Vous pouvez annuler jusqu'à 48h avant la séance</li>
              <li>• Un rappel vous sera envoyé la veille de votre séance</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={previousStep}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          Retour
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-bold flex items-center gap-2"
        >
          {loading ? (
            <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />Confirmation…</>
          ) : (
            <><CheckCircleIcon className="w-5 h-5" />Confirmer la réservation</>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookingStep5;
