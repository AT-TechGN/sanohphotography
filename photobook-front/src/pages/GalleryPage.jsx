import { useEffect, useState } from 'react';
import galleryService from '../services/galleryService';
import serviceService from '../services/serviceService';
import Loading from '../components/common/Loading';
import useUIStore from '../stores/uiStore';

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
      src: `http://localhost/photobook-api/public${photo.filePath}`,
      alt: photo.album?.title || 'Photo',
    }));
    openLightbox(images, index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Notre Galerie Photo
          </h1>
          <p className="text-lg text-gray-600">
            Découvrez nos réalisations photographiques
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtre période */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <div className="flex flex-wrap gap-2">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => handleFilterChange('period', period.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filters.period === period.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Grille de photos (Masonry) */}
        {loading ? (
          <Loading />
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune photo trouvée</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoClick(index)}
                  className="relative overflow-hidden rounded-lg shadow-md group cursor-pointer"
                >
                  <img
                    src={`http://localhost/photobook-api/public${photo.thumbnailPath || photo.filePath}`}
                    alt="Photo"
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {photo.isFeatured && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      ⭐ En vedette
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-sm font-medium">
                        {photo.album?.title || 'Album'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Précédent
                </button>

                <div className="flex gap-2">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-4 py-2 rounded-lg ${
                        pagination.page === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Suivant
                </button>
              </div>
            )}

            {/* Stats */}
            {pagination && (
              <div className="mt-8 text-center text-gray-600">
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
