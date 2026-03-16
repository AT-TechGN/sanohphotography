import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { 
  CalendarIcon, 
  PhotoIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import CalendarBooking from '../components/booking/CalendarBooking';
import useAuthStore from '../stores/authStore';

const ClientDashboardEnhanced = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('calendar');

  const tabs = [
    { id: 'calendar', name: 'Calendrier', icon: CalendarIcon },
    { id: 'bookings', name: 'Mes Réservations', icon: ClockIcon },
    { id: 'photos', name: 'Mes Photos', icon: PhotoIcon },
  ];

  const handleDateSelect = (date) => {
    console.log('Date sélectionnée:', date);
    // Naviguer vers la page de réservation avec cette date pré-remplie
  };

  const handleEventClick = (eventProps) => {
    console.log('Événement cliqué:', eventProps);
    // Afficher les détails de la réservation dans une modal
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Bienvenue, {user?.firstName} !
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gérez vos réservations et consultez vos photos
          </p>
        </Motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <tab.icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${activeTab === tab.id
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }
                  `} />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <Motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'calendar' && (
            <CalendarBooking
              onDateSelect={handleDateSelect}
              onEventClick={handleEventClick}
            />
          )}

          {activeTab === 'bookings' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Liste des Réservations
              </h2>
              <div className="space-y-4">
                {/* Exemple de réservation - à remplacer par des données réelles */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                        <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Séance Portrait
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          15 Mars 2026 à 14:00
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Confirmée
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Mes Albums Photos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Exemple d'album - à remplacer par des données réelles */}
                <div className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700">
                    <PhotoIcon className="w-full h-full p-20 text-gray-400" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 p-4 text-white">
                      <h3 className="font-bold text-lg">Mariage 2026</h3>
                      <p className="text-sm">25 photos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Motion.div>
      </div>
    </div>
  );
};

export default ClientDashboardEnhanced;
