import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import serviceService from '../services/serviceService';
import Loading from '../components/common/Loading';
import { CalendarIcon, UserGroupIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pt-16">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-gray-900 via-amber-950 to-gray-900 text-white py-16">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Nos Services Photo
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Des prestations sur mesure pour tous vos événements. Mariage, portrait, événementiel - nous capturons vos moments précieux.
              </p>
            </Motion.div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8">
        {/* Filtres par catégorie */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-full font-medium text-sm transition-all ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Tous ({services.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-6 py-3 rounded-full font-medium text-sm transition-all ${
                  selectedCategory === cat.category
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.category} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Liste des services */}
        <Motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredServices.map((service) => (
            <Motion.div
              key={service.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Image placeholder avec gradient */}
              <div className="h-48 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <span className="text-6xl relative z-10">📸</span>
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full" />
              </div>

              {/* Contenu */}
              <div className="p-6">
                {/* Catégorie */}
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full mb-3">
                  {service.category}
                </span>

                {/* Titre */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {service.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {service.description}
                </p>

                {/* Infos */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <ClockIcon className="w-5 h-5 mr-2 text-amber-500" />
                    <span>{service.durationMin} minutes</span>
                  </div>
                  {service.maxParticipants && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <UserGroupIcon className="w-5 h-5 mr-2 text-amber-500" />
                      <span>Max {service.maxParticipants} participants</span>
                    </div>
                  )}
                </div>

                {/* Prix et Réserver */}
                <div className="flex items-end justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">À partir de</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {formatPrice(service.basePrice)}
                    </p>
                  </div>
                  <Link
                    to="/booking"
                    state={{ selectedService: service }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white font-semibold rounded-full hover:bg-amber-700 transition-colors"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Réserver
                  </Link>
                </div>
              </div>
            </Motion.div>
          ))}
        </Motion.div>

        {filteredServices.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Aucun service trouvé dans cette catégorie
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;

