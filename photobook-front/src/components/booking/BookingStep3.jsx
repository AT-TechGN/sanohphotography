/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import bookingService from '../../services/bookingService';
import useBookingStore from '../../stores/bookingStore';
import Loading from '../common/Loading';

const BookingStep3 = () => {
  const {
    selectedService,
    selectedDate,
    selectedSlot,
    selectSlot,
    setAvailableSlots,
    availableSlots,
    nextStep,
    previousStep,
  } = useBookingStore();

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    loadAvailableSlots();
  }, []);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getAvailableSlots(
        selectedService.id,
        selectedDate,
      );
      // BUG CORRIGÉ : data.slots crash si l'API retourne directement un tableau
      // Normalisation : accepte { slots: [...] } OU un tableau direct
      const slots = Array.isArray(data) ? data : (data?.slots ?? []);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Erreur chargement créneaux:', err);
      setError('Impossible de charger les créneaux. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedSlot) nextStep();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Étape 3 : Choisissez un créneau
      </h2>

      {/* Récapitulatif */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4 mb-6">
        <p className="font-bold text-purple-900 dark:text-purple-300 mb-1">{selectedService?.name}</p>
        <p className="text-sm text-purple-700 dark:text-purple-400">
          📅 {new Date(selectedDate).toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {/* Créneaux */}
      {loading ? (
        <Loading text="Recherche des créneaux disponibles..." />
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={loadAvailableSlots} className="text-purple-600 hover:text-purple-700 font-medium">
            Réessayer
          </button>
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Aucun créneau disponible pour cette date
          </p>
          <button onClick={previousStep} className="text-purple-600 hover:text-purple-700 font-medium">
            ← Choisir une autre date
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {availableSlots.length} créneau(x) disponible(s)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {availableSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => selectSlot(slot)}
                className={`p-4 border-2 rounded-xl transition-all text-left ${
                  selectedSlot?.startTime === slot.startTime
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-sm'
                }`}
              >
                <p className="font-bold text-lg text-gray-900 dark:text-white">{slot.startTime}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{slot.endTime}</p>
                {slot.employee && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 truncate">
                    📷 {slot.employee.firstName}
                  </p>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={previousStep}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedSlot}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
        >
          Continuer
        </button>
      </div>
    </div>
  );
};

export default BookingStep3;
