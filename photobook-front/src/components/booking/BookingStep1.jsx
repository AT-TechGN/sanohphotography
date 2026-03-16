import { useEffect, useState, useCallback } from 'react';
import serviceService from '../../services/serviceService';
import useBookingStore from '../../stores/bookingStore';
import Loading from '../common/Loading';
import {
  CameraIcon, ClockIcon, CurrencyDollarIcon,
  UsersIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/**
 * CORRECTIONS :
 * 1. Gestion d'erreur complète avec bouton Réessayer
 * 2. Affichage explicite si aucun service n'est disponible
 * 3. useCallback sur loadServices pour éviter re-renders
 * 4. Formatage prix cohérent avec le reste de l'app (GNF)
 * 5. Design aligné avec le thème purple/pink de l'app
 */

// Mapping catégories backend → label + icône
const CATEGORY_MAP = {
  mariage:        { label: 'Mariage',        icon: '💍' },
  fiancailles:    { label: 'Fiançailles',     icon: '💑' },
  bapteme:        { label: 'Baptême',         icon: '✝️' },
  communion:      { label: 'Communion',       icon: '🕊️' },
  anniversaire:   { label: 'Anniversaire',    icon: '🎂' },
  ceremonie:      { label: 'Cérémonie',       icon: '🎊' },
  portrait:       { label: 'Portrait',        icon: '🤳' },
  grossesse:      { label: 'Grossesse',       icon: '🤰' },
  naissance:      { label: 'Naissance',       icon: '👶' },
  famille:        { label: 'Famille',         icon: '👨‍👩‍👧' },
  mode:           { label: 'Mode',            icon: '👗' },
  shopping:       { label: 'Shopping',        icon: '🛍️' },
  catalogue:      { label: 'Catalogue',       icon: '📦' },
  corporate:      { label: 'Corporate',       icon: '🏢' },
  culinaire:      { label: 'Culinaire',       icon: '🍽️' },
  book_artistique:{ label: 'Book artistique', icon: '🎨' },
};

const BookingStep1 = () => {
  const { selectedService, selectService, nextStep } = useBookingStore();
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await serviceService.getActive();
      // getActive() peut retourner un tableau direct ou { data: [...] }
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setServices(list);
    } catch (err) {
      console.error('Erreur chargement services:', err);
      setError('Impossible de charger les services. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  const handleSelectService = (service) => {
    selectService(service);
    nextStep();
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('fr-GN', {
      style: 'currency', currency: 'GNF', minimumFractionDigits: 0,
    }).format(price);

  const getCategoryInfo = (cat) =>
    CATEGORY_MAP[cat] ?? { label: cat, icon: '📷' };

  if (loading) return <Loading text="Chargement des services…" />;

  if (error) return (
    <div className="text-center py-12">
      <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <p className="text-red-500 mb-6">{error}</p>
      <button
        onClick={loadServices}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
      >
        Réessayer
      </button>
    </div>
  );

  if (services.length === 0) return (
    <div className="text-center py-12">
      <CameraIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Aucun service disponible
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        Nos services seront bientôt disponibles. Revenez plus tard.
      </p>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Choisissez votre service
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {services.length} service(s) disponible(s)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => {
          const { label, icon } = getCategoryInfo(service.category);
          const isSelected = selectedService?.id === service.id;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => handleSelectService(service)}
              className={`text-left border-2 rounded-2xl p-6 transition-all hover:shadow-lg focus:outline-none ${
                isSelected
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                      {service.name}
                    </h3>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                      {label}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm flex-shrink-0">
                    ✓
                  </span>
                )}
              </div>

              {/* Description */}
              {service.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>
              )}

              {/* Infos */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span>{service.durationMin} minutes</span>
                </div>
                {service.maxParticipants && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <UsersIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>Max {service.maxParticipants} participant(s)</span>
                  </div>
                )}
              </div>

              {/* Prix */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">À partir de</p>
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {formatPrice(service.basePrice)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-6">
        Cliquez sur un service pour passer à l'étape suivante
      </p>
    </div>
  );
};

export default BookingStep1;
