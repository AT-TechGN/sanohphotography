import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CameraIcon, 
  SparklesIcon, 
  HeartIcon, 
  StarIcon,
  CalendarIcon,
  PhotoIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import galleryService from '../services/galleryService';
import reviewService from '../services/reviewService';
import Loading from '../components/common/Loading';
import useUIStore from '../stores/uiStore';
import CountUp from 'react-countup';

const HomePageNew = () => {
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { openLightbox } = useUIStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [photosData, reviewsData, statsData] = await Promise.all([
        galleryService.getFeatured(6),
        reviewService.getApproved(1, 3),
        reviewService.getStats(),
      ]);

      setFeaturedPhotos(photosData);
      setReviews(reviewsData.data || reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPhotoLightbox = (index) => {
    const images = featuredPhotos.map(photo => ({
      src: `http://localhost/photobook-api/public${photo.filePath}`,
      alt: photo.album?.title || 'Photo',
      width: photo.width || 1920,
      height: photo.height || 1080,
    }));
    openLightbox(images, index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section - Modern & Elegant */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white mb-6"
            >
              <CameraIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Photographe Professionnel à Conakry</span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight">
              Immortalisez vos
              <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                moments précieux
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Mariage, Portrait, Événementiel - Des souvenirs qui durent toute une vie
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/booking"
                className="group relative inline-flex items-center px-8 py-4 bg-white text-purple-600 rounded-full text-lg font-bold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center">
                  <CalendarIcon className="w-6 h-6 mr-2" />
                  Réserver une séance
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </Link>
              
              <Link
                to="/gallery"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-full text-lg font-bold hover:bg-white hover:text-purple-600 transition-all duration-300 hover:scale-105"
              >
                <PhotoIcon className="w-6 h-6 mr-2" />
                Voir la galerie
              </Link>
            </div>

            {/* Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-white mb-2">
                    <CountUp end={500} duration={2.5} />+
                  </div>
                  <div className="text-white/80 text-sm">Clients satisfaits</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-white mb-2">
                    <CountUp end={stats.totalReviews || 150} duration={2.5} />+
                  </div>
                  <div className="text-white/80 text-sm">Avis positifs</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-white mb-2">
                    <CountUp end={5000} duration={2.5} />+
                  </div>
                  <div className="text-white/80 text-sm">Photos capturées</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-white mb-2">
                    <CountUp end={stats.averageRating || 5} decimals={1} duration={2.5} />
                  </div>
                  <div className="text-white/80 text-sm">Note moyenne</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center">
            <span className="text-white text-sm mb-2">Découvrir</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2"
            >
              <div className="w-1 h-2 bg-white rounded-full"></div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Nos Services
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Des prestations professionnelles adaptées à tous vos besoins
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: HeartIcon,
                title: "Mariage",
                description: "Immortalisez le plus beau jour de votre vie avec des photos exceptionnelles",
                color: "from-pink-500 to-rose-500"
              },
              {
                icon: CameraIcon,
                title: "Portrait",
                description: "Des portraits professionnels qui capturent votre essence unique",
                color: "from-purple-500 to-indigo-500"
              },
              {
                icon: SparklesIcon,
                title: "Événementiel",
                description: "Couverture complète de vos événements professionnels et privés",
                color: "from-blue-500 to-cyan-500"
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white dark:bg-gray-700 rounded-2xl shadow-xl overflow-hidden group cursor-pointer"
              >
                <div className={`h-2 bg-gradient-to-r ${service.color}`}></div>
                <div className="p-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${service.color} mb-6`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {service.description}
                  </p>
                  <Link
                    to="/services"
                    className="inline-flex items-center mt-6 text-purple-600 dark:text-purple-400 font-semibold group-hover:gap-2 transition-all"
                  >
                    En savoir plus
                    <svg className="w-5 h-5 ml-1 group-hover:ml-2 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Photos Gallery */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Nos Réalisations Récentes
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Découvrez quelques-unes de nos meilleures créations
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featuredPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                onClick={() => openPhotoLightbox(index)}
                className="relative overflow-hidden rounded-2xl shadow-2xl group cursor-pointer aspect-square"
              >
                <img
                  src={`http://localhost/photobook-api/public${photo.filePath}`}
                  alt={photo.album?.title || 'Photo'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-lg font-bold mb-2">
                      {photo.album?.title || 'Album'}
                    </p>
                    <p className="text-sm text-gray-200">
                      Cliquez pour agrandir
                    </p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/gallery"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <PhotoIcon className="w-6 h-6 mr-2" />
              Voir toute la galerie
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Ce que disent nos clients
            </h2>
            {stats && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-8 h-8 ${i < Math.round(stats.averageRating) ? 'fill-current' : ''}`}
                    />
                  ))}
                </div>
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                  {stats.averageRating}/5
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  ({stats.totalReviews} avis)
                </span>
              </div>
            )}
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-700 rounded-2xl shadow-xl p-8 relative"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <div className="flex text-yellow-400 mb-4 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-5 h-5 ${i < review.rating ? 'fill-current' : ''}`}
                    />
                  ))}
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                  {review.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {review.content}
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                    {review.client?.firstName?.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {review.client?.firstName} {review.client?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Client vérifié
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-900 dark:to-pink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Prêt à réserver votre séance photo ?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Réservez en ligne en quelques clics et choisissez le créneau qui vous convient
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/booking"
                className="group relative inline-flex items-center px-10 py-5 bg-white text-purple-600 rounded-full text-xl font-bold overflow-hidden hover:scale-105 transition-all duration-300 shadow-2xl"
              >
                <CalendarIcon className="w-7 h-7 mr-3" />
                Réserver maintenant
              </Link>
              
              <Link
                to="/services"
                className="inline-flex items-center px-10 py-5 bg-transparent border-2 border-white text-white rounded-full text-xl font-bold hover:bg-white hover:text-purple-600 transition-all duration-300"
              >
                <CheckCircleIcon className="w-7 h-7 mr-3" />
                Voir nos services
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: CheckCircleIcon, text: "Qualité garantie" },
                { icon: HeartIcon, text: "Satisfaction client" },
                { icon: CameraIcon, text: "Équipement professionnel" },
                { icon: SparklesIcon, text: "Créativité unique" }
              ].map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center text-white"
                >
                  <badge.icon className="w-10 h-10 mb-3" />
                  <span className="text-sm font-medium">{badge.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePageNew;
