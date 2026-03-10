import { useState } from 'react';
import useBookingStore from '../../stores/bookingStore';

const BookingStep2 = () => {
  const { selectedService, selectedDate, selectDate, nextStep, previousStep } = useBookingStore();
  const [tempDate, setTempDate] = useState(selectedDate || '');

  const handleContinue = () => {
    if (tempDate) {
      selectDate(tempDate);
      nextStep();
    }
  };

  // Date minimale = aujourd'hui
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Étape 2 : Choisissez la date
      </h2>

      {/* Service sélectionné */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 mb-1">Service sélectionné :</p>
        <p className="font-bold text-blue-900">{selectedService?.name}</p>
      </div>

      {/* Sélection de date */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionnez une date
        </label>
        <input
          type="date"
          value={tempDate}
          onChange={(e) => setTempDate(e.target.value)}
          min={minDate}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
        <p className="mt-2 text-sm text-gray-500">
          Vous pouvez réserver à partir d'aujourd'hui
        </p>
      </div>

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
          disabled={!tempDate}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continuer
        </button>
      </div>
    </div>
  );
};

export default BookingStep2;
