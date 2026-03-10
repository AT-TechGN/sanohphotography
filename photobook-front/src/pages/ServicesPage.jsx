import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import serviceService from '../services/serviceService';
import Loading from '../components/common/Loading';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesData, categoriesData] = await Promise.all([
        serviceService.getActive(),
        serviceService.getCategories(),
      ]);
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur chargement services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices =
    selectedCategory === 'all'
      ? services
      : services.filter((s) => s.category === selectedCategory);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nos Services Photo
          </h1>
          <p className="text-lg text-gray-600">
            Des prestations sur mesure pour tous vos événements
          </p>
        </div>

        {/* Filtres par catégorie */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({services.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat.category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.category} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Liste des services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Image placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-6xl">📸</span>
              </div>

              {/* Contenu */}
              <div className="p-6">
                {/* Catégorie */}
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mb-3">
                  {service.category}
                </span>

                {/* Titre */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {service.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {service.description}
                </p>

                {/* Infos */}
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

                {/* Prix */}
                <div className="flex items-end justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">À partir de</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(service.basePrice)}
                    </p>
                  </div>
                  <Link
                    to="/booking"
                    state={{ selectedService: service }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Réserver
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucun service trouvé dans cette catégorie
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
