import { useState } from 'react';
import useBookingStore from '../../stores/bookingStore';

const BookingStep4 = () => {
  const {
    selectedService,
    clientInfo,
    updateClientInfo,
    nextStep,
    previousStep,
  } = useBookingStore();

  const [formData, setFormData] = useState({
    participants: clientInfo.participants || 1,
    notes: clientInfo.notes || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    updateClientInfo(formData);
    nextStep();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Étape 4 : Informations complémentaires
      </h2>

      <form className="space-y-6">
        {/* Nombre de participants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de participants
          </label>
          <input
            type="number"
            name="participants"
            value={formData.participants}
            onChange={handleChange}
            min="1"
            max={selectedService?.maxParticipants || 100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {selectedService?.maxParticipants && (
            <p className="mt-1 text-sm text-gray-500">
              Maximum : {selectedService.maxParticipants} participants
            </p>
          )}
        </div>

        {/* Notes / demandes spéciales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes ou demandes spéciales (optionnel)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Exemple : préférence pour fond blanc, besoin de maquillage, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          ></textarea>
        </div>
      </form>

      {/* Boutons de navigation */}
      <div className="flex justify-between pt-6 border-t mt-8">
        <button
          onClick={previousStep}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continuer
        </button>
      </div>
    </div>
  );
};

export default BookingStep4;
