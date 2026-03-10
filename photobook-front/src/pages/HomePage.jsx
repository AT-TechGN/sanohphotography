import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import galleryService from '../services/galleryService';
import { API_ASSETS_BASE } from '../services/api';
import { buildSrcSet, defaultSizesForFeatured } from '../utils/imageHelpers';
import reviewService from '../services/reviewService';
import Loading from '../components/common/Loading';

const HomePage = () => {
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Immortalisez vos moments précieux
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Photographe professionnel à Conakry - Mariage, Portrait, Événementiel
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/booking"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Réserver une séance
              </Link>
              <Link
                to="/gallery"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Voir la galerie
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Photos en vedette */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos réalisations récentes
            </h2>
            <p className="text-lg text-gray-600">
              Découvrez quelques-unes de nos meilleures photos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative overflow-hidden rounded-lg shadow-lg group cursor-pointer"
              >
                <img
                  src={`${API_ASSETS_BASE}${photo.thumbnailPath || photo.filePath}`}
                  srcSet={buildSrcSet(photo, API_ASSETS_BASE)}
                  sizes={defaultSizesForFeatured()}
                  alt={photo.album?.title || 'Photo'}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-300"
                />
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

          <div className="text-center mt-12">
            <Link
              to="/gallery"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Voir toute la galerie
            </Link>
          </div>
        </div>
      </section>

      {/* Avis clients */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ce que disent nos clients
            </h2>
            {stats && (
              <div className="flex items-center justify-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-2xl">
                      {i < Math.round(stats.averageRating) ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-700">
                  {stats.averageRating}/5
                </span>
                <span className="text-gray-500">
                  ({stats.totalReviews} avis)
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <div className="flex text-yellow-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                  ))}
                </div>
                <h3 className="font-bold text-lg mb-2">{review.title}</h3>
                <p className="text-gray-600 mb-4">{review.content}</p>
                <p className="text-sm text-gray-500">
                  - {review.client?.firstName} {review.client?.lastName}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à réserver votre séance photo ?
          </h2>
          <p className="text-xl mb-8">
            Réservez en ligne en quelques clics et choisissez le créneau qui vous convient
          </p>
          <Link
            to="/booking"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Réserver maintenant
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
