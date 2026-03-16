import { useState } from 'react';
import useBookingStore from '../../stores/bookingStore';
import { UsersIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

const BookingStep4 = () => {
  const { selectedService, selectedDate, selectedSlot, clientInfo, updateClientInfo, nextStep, previousStep } = useBookingStore();

  const [formData, setFormData] = useState({
    participants: clientInfo.participants || 1,
    notes:        clientInfo.notes || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    updateClientInfo(formData);
    nextStep();
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '—';

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Informations complémentaires
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Quelques détails pour finaliser votre réservation
      </p>

      {/* Récap */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-8 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Service</span>
          <span className="font-medium text-gray-900 dark:text-white">{selectedService?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Date</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedDate)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Heure</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {selectedSlot?.startTime} — {selectedSlot?.endTime}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Participants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-purple-600" />
            Nombre de participants
          </label>
          <input
            type="number"
            name="participants"
            value={formData.participants}
            onChange={handleChange}
            min="1"
            max={selectedService?.maxParticipants || 100}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
          />
          {selectedService?.maxParticipants && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Maximum : {selectedService.maxParticipants} participants
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-purple-600" />
            Notes ou demandes spéciales <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Exemple : préférence pour fond blanc, besoin de maquillage…"
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-600 mt-8">
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
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
        >
          Continuer →
        </button>
      </div>
    </div>
  );
};

export default BookingStep4;
