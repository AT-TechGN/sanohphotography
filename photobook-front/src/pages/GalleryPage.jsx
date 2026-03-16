/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import galleryService from '../services/galleryService';
import { API_ASSETS_BASE } from '../services/api';
import { buildSrcSet, defaultSizesForGallery } from '../utils/imageHelpers';
import serviceService from '../services/serviceService';
import Loading from '../components/common/Loading';
import useUIStore from '../stores/uiStore';
import { ArrowLeftIcon, FunnelIcon, PhotoIcon } from '@heroicons/react/24/outline';

const GalleryPage = () => {
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    period: 'all',
    category: '',
    page: 1,
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { openLightbox } = useUIStore();

  const periods = [
    { value: 'all', label: 'Toutes' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const data = await serviceService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await galleryService.getPhotos(filters);
      setPhotos(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erreur chargement photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhotoClick = (index) => {
    const images = photos.map((photo) => ({
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
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pt-16">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-gray-900 via-amber-950 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Notre Galerie Photo
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Découvrez nos réalisations photographiques à travers des moments capturés avec passion et expertise.
              </p>
            </Motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres - Mobile Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow text-gray-700 dark:text-gray-300"
          >
            <FunnelIcon className="w-5 h-5" />
            Filtres
          </button>
        </div>

        {/* Filtres */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtre période */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Période
              </label>
              <div className="flex flex-wrap gap-2">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => handleFilterChange('period', period.value)}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                      filters.period === period.value
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre catégorie */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Catégorie
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grille de photos */}
        {loading ? (
          <Loading />
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <PhotoIcon className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Aucune photo trouvée</p>
            <Link to="/" className="inline-flex items-center gap-2 mt-4 text-amber-600 dark:text-amber-400 font-medium">
              <ArrowLeftIcon className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>
        ) : (
          <>
            <Motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {photos.map((photo, index) => (
                <Motion.div
                  key={photo.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handlePhotoClick(index)}
                  className="relative aspect-square overflow-hidden rounded-xl shadow-lg group cursor-pointer"
                >
                  <img
                    src={`${API_ASSETS_BASE}${photo.thumbnailPath || photo.filePath}`}
                    srcSet={buildSrcSet(photo, API_ASSETS_BASE)}
                    sizes={defaultSizesForGallery()}
                    alt={photo.album?.title || 'Photo'}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {photo.isFeatured && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      ⭐
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white font-medium text-sm">
                        {photo.album?.title || 'Album'}
                      </p>
                    </div>
                  </div>
                </Motion.div>
              ))}
            </Motion.div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Précédent
                </button>

                <div className="flex gap-2">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`w-10 h-10 rounded-lg font-medium ${
                        pagination.page === i + 1
                          ? 'bg-amber-600 text-white'
                          : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Suivant
                </button>
              </div>
            )}

            {/* Stats */}
            {pagination && (
              <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                Affichage de {(pagination.page - 1) * pagination.limit + 1} à{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                {pagination.total} photos
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;

