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

  useEffect(() => {
    loadAvailableSlots();
  }, []);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAvailableSlots(
        selectedService.id,
        selectedDate
      );
      setAvailableSlots(data.slots);
    } catch (error) {
      console.error('Erreur chargement créneaux:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedSlot) {
      nextStep();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Étape 3 : Choisissez un créneau
      </h2>

      {/* Récapitulatif */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="font-bold text-blue-900 mb-2">{selectedService?.name}</p>
        <p className="text-sm text-blue-800">
          Date : {new Date(selectedDate).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Créneaux disponibles */}
      {loading ? (
        <Loading />
      ) : availableSlots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Aucun créneau disponible pour cette date
          </p>
          <button
            onClick={previousStep}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Choisir une autre date
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            {availableSlots.length} créneau(x) disponible(s)
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {availableSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => selectSlot(slot)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedSlot?.startTime === slot.startTime
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <p className="font-bold text-lg">{slot.startTime}</p>
                <p className="text-xs text-gray-500">{slot.endTime}</p>
                {slot.employee && (
                  <p className="text-xs text-gray-600 mt-2">
                    {slot.employee.firstName}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Boutons de navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={previousStep}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedSlot}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continuer
        </button>
      </div>
    </div>
  );
};

export default BookingStep3;
