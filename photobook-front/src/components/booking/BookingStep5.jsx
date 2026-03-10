import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import useBookingStore from '../../stores/bookingStore';
import useUIStore from '../../stores/uiStore';

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
  const [loading, setLoading] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const bookingData = getBookingData();
      const result = await bookingService.create(bookingData);

      showSuccess('Réservation créée avec succès !');
      reset();
      navigate('/dashboard');
    } catch (error) {
      showError(error.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Étape 5 : Confirmation
      </h2>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold mb-4">Récapitulatif de votre réservation</h3>

        <div className="space-y-4">
          {/* Service */}
          <div className="flex justify-between">
            <span className="text-gray-600">Service :</span>
            <span className="font-medium">{selectedService?.name}</span>
          </div>

          {/* Date */}
          <div className="flex justify-between">
            <span className="text-gray-600">Date :</span>
            <span className="font-medium">
              {new Date(selectedDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Heure */}
          <div className="flex justify-between">
            <span className="text-gray-600">Heure :</span>
            <span className="font-medium">
              {selectedSlot?.startTime} - {selectedSlot?.endTime}
            </span>
          </div>

          {/* Durée */}
          <div className="flex justify-between">
            <span className="text-gray-600">Durée :</span>
            <span className="font-medium">{selectedService?.durationMin} minutes</span>
          </div>

          {/* Participants */}
          <div className="flex justify-between">
            <span className="text-gray-600">Participants :</span>
            <span className="font-medium">{clientInfo.participants}</span>
          </div>

          {/* Notes */}
          {clientInfo.notes && (
            <div>
              <p className="text-gray-600 mb-1">Notes :</p>
              <p className="text-sm bg-white p-3 rounded border">
                {clientInfo.notes}
              </p>
            </div>
          )}

          {/* Prix */}
          <div className="flex justify-between pt-4 border-t border-gray-300">
            <span className="text-lg font-bold">Total :</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatPrice(selectedService?.basePrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Informations importantes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <h4 className="font-bold text-yellow-900 mb-2">
          ⚠️ Informations importantes
        </h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Votre réservation sera confirmée par le photographe sous 24h</li>
          <li>• Vous recevrez un email de confirmation</li>
          <li>• Vous pouvez annuler jusqu'à 48h avant la séance</li>
          <li>• Un rappel vous sera envoyé la veille de votre séance</li>
        </ul>
      </div>

      {/* Boutons de navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={previousStep}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Retour
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-bold"
        >
          {loading ? 'Confirmation...' : 'Confirmer la réservation'}
        </button>
      </div>
    </div>
  );
};

export default BookingStep5;
