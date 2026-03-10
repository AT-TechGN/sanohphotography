import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import {
  HeartIcon,
  StarIcon,
  CalendarIcon,
  ArrowRightIcon,
  PlayIcon,
  PhotoIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import galleryService from '../services/galleryService';
import { API_ASSETS_BASE } from '../services/api';
import { buildSrcSet, defaultSizesForFeatured } from '../utils/imageHelpers';
import reviewService from '../services/reviewService';
import Loading from '../components/common/Loading';
import useUIStore from '../stores/uiStore';

// Composant titre de section réutilisable
const SectionHeading = ({ title, subtitle, align = 'center' }) => (
  <div className={`max-w-2xl mx-auto mb-12 ${align === 'left' ? 'text-left max-w-none' : 'text-center'}`}>
    {subtitle && (
      <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 tracking-wide uppercase">
        {subtitle}
      </p>
    )}
    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
      {title}
    </h2>
  </div>
);

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
    const images = featuredPhotos.map((photo) => ({
      src: `${API_ASSETS_BASE}${photo.filePath}`,
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
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Hero Section - Design Tailwind UI Blocks */}
      <section className="relative pt-16 min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image */}
        {featuredPhotos[0] ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${API_ASSETS_BASE}${featuredPhotos[0].filePath})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-gray-900 to-pink-900" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gray-950/60" />

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Photographe professionnel à Conakry
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
              Immortalisez vos
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                moments précieux
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              Mariage, Portrait, Événementiel — des souvenirs qui durent toute une vie. 
              Capturez l'essence de vos moments uniques avec expertise et créativité.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/booking"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-colors"
              >
                <CalendarIcon className="w-5 h-5" />
                Réserver une séance
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                to="/gallery"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900/50 text-white font-semibold rounded-full border border-gray-700 hover:bg-gray-800 transition-colors backdrop-blur-sm"
              >
                <PhotoIcon className="w-5 h-5" />
                Voir la galerie
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 sm:gap-12">
              {[
                { value: stats?.totalReviews || 0, label: 'Clients satisfaits' },
                { value: '5+', label: "Années d'expérience" },
                { value: '500+', label: 'Séances réalisées' },
              ].map((stat, index) => (
                <div key={index}>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </Motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            title="Nos Services" 
            subtitle="Ce que je propose"
          />

          <Motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: HeartIcon,
                title: 'Mariage',
                description: 'Immortalisez le plus beau jour de votre vie avec des photos exceptionnelles qui racontent votre histoire.',
                image: featuredPhotos[1] ? `${API_ASSETS_BASE}${featuredPhotos[1].thumbnailPath || featuredPhotos[1].filePath}` : null,
              },
              {
                icon: UserGroupIcon,
                title: 'Portrait',
                description: 'Des portraits professionnels qui capturent votre essence unique, que ce soit en solo, en famille ou entre amis.',
                image: featuredPhotos[2] ? `${API_ASSETS_BASE}${featuredPhotos[2].thumbnailPath || featuredPhotos[2].filePath}` : null,
              },
              {
                icon: HeartIcon,
                title: 'Événementiel',
                description: 'Couverture complète de vos événements professionnels et privés, capturant chaque moment important.',
                image: featuredPhotos[3] ? `${API_ASSETS_BASE}${featuredPhotos[3].thumbnailPath || featuredPhotos[3].filePath}` : null,
              },
            ].map((service, index) => (
              <Motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <service.icon className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    {service.description}
                  </p>
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:gap-3 transition-all"
                  >
                    En savoir plus
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </Motion.div>
            ))}
          </Motion.div>
        </div>
      </section>

      {/* Featured Gallery Section */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <SectionHeading 
              title="Réalisations Récentes" 
              subtitle="Portfolio"
              align="left"
            />
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:gap-3 transition-all"
            >
              Voir toute la galerie
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <Motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {featuredPhotos.slice(0, 6).map((photo, index) => (
              <Motion.div
                key={photo.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                onClick={() => openPhotoLightbox(index)}
                className={`relative aspect-square overflow-hidden rounded-xl group cursor-pointer ${
                  index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                }`}
              >
                <img
                  src={`${API_ASSETS_BASE}${photo.thumbnailPath || photo.filePath}`}
                  srcSet={buildSrcSet(photo, API_ASSETS_BASE)}
                  sizes={defaultSizesForFeatured()}
                  alt={photo.album?.title || 'Photo'}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <PlayIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </Motion.div>
            ))}
          </Motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            title="Ce que disent mes clients" 
            subtitle="Témoignages"
          />

          {stats && (
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-6 h-6 ${i < Math.round(stats.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating}/5
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                ({stats.totalReviews} avis)
              </span>
            </div>
          )}

          <Motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {reviews.map((review) => (
              <Motion.div
                key={review.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg"
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>

                {/* Content */}
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                  {review.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {review.content}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {review.client?.firstName?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {review.client?.firstName} {review.client?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Client vérifié
                    </p>
                  </div>
                </div>
              </Motion.div>
            ))}
          </Motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Prêt à créer vos souvenirs ?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Réservez votre séance photo en quelques clics. Choisissez le créneau qui vous convient et laissez-moi capturer vos moments précieux.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/booking"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
                >
                  <CalendarIcon className="w-5 h-5" />
                  Réserver maintenant
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-full border border-white/30 hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Voir les services
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePageNew;

