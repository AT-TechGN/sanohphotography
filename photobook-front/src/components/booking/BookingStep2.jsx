import { useState } from 'react';
import useBookingStore from '../../stores/bookingStore';
import { CalendarDaysIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const BookingStep2 = () => {
  const { selectedService, selectedDate, selectDate, nextStep, previousStep } = useBookingStore();
  const [tempDate, setTempDate] = useState(selectedDate || '');

  // Date minimale = demain (pas aujourd'hui car besoin de préparation)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Date maximale = 1 an
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handleContinue = () => {
    if (tempDate) {
      selectDate(tempDate);
      nextStep();
    }
  };

  const formatSelectedDate = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Choisissez la date
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Sélectionnez une date pour votre séance
      </p>

      {/* Service sélectionné */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <ClockIcon className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white">{selectedService?.name}</p>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            <span>⏱️ {selectedService?.durationMin} min</span>
            {selectedService?.basePrice && (
              <span>
                · {new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(selectedService.basePrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sélection de date */}
      <div className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <CalendarDaysIcon className="w-4 h-4 text-amber-600" />
          Sélectionnez une date
        </label>
        <input
          type="date"
          value={tempDate}
          onChange={(e) => setTempDate(e.target.value)}
          min={minDate}
          max={maxDateStr}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg text-gray-900 dark:text-white"
        />
        {tempDate && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 font-medium">
            📅 {formatSelectedDate(tempDate)}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Les réservations sont possibles à partir de demain
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
        <button
          type="button"
          onClick={previousStep}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!tempDate}
          className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
        >
          Continuer →
        </button>
      </div>
    </div>
  );
};

export default BookingStep2;
