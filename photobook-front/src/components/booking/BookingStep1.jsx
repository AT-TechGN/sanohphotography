import { useEffect, useState } from 'react';
import serviceService from '../../services/serviceService';
import useBookingStore from '../../stores/bookingStore';
import Loading from '../common/Loading';

const BookingStep1 = () => {
  const { selectedService, selectService, nextStep } = useBookingStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await serviceService.getActive();
      setServices(data);
    } catch (error) {
      console.error('Erreur chargement services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = (service) => {
    selectService(service);
    nextStep();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Étape 1 : Choisissez votre service
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => handleSelectService(service)}
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedService?.id === service.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {service.name}
              </h3>
              {selectedService?.id === service.id && (
                <span className="text-blue-600 text-2xl">✓</span>
              )}
            </div>

            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mb-3">
              {service.category}
            </span>

            <p className="text-gray-600 text-sm mb-4">
              {service.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-2">⏱️</span>
                <span>{service.durationMin} minutes</span>
              </div>
              {service.maxParticipants && (
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">👥</span>
                  <span>Max {service.maxParticipants} participants</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">À partir de</p>
              <p className="text-xl font-bold text-blue-600">
                {formatPrice(service.basePrice)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingStep1;
