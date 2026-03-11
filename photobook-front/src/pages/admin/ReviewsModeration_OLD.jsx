import { useEffect, useState } from 'react';
import reviewService from '../../services/reviewService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';

const ReviewsModeration = () => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const { showSuccess, showError } = useUIStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, approved, statsData] = await Promise.all([
        reviewService.getPending(),
        reviewService.getApproved(1, 20),
        reviewService.getStats(),
      ]);
      setPendingReviews(pending);
      setApprovedReviews(approved.data || approved);
      setStats(statsData);
    } catch (error) {
      showError('Erreur chargement avis');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await reviewService.approve(id);
      showSuccess('Avis approuvé');
      loadData();
    } catch (error) {
      showError('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cet avis ?')) return;

    try {
      await reviewService.reject(id);
      showSuccess('Avis rejeté');
      loadData();
    } catch (error) {
      showError('Erreur lors du rejet');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await reviewService.toggleFeatured(id);
      showSuccess('Statut vedette modifié');
      loadData();
    } catch (error) {
      showError('Erreur');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Modération des Avis</h1>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm mb-2">Note moyenne</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-yellow-600">{stats.averageRating}</p>
              <div className="flex text-xl">{renderStars(Math.round(stats.averageRating))}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm mb-2">Total avis</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm mb-2">En attente</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingReviews}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm mb-2">Répartition</p>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span>{star}★</span>
                  <div className="flex-1 bg-gray-200 rounded h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded"
                      style={{
                        width: `${
                          (stats.distribution[star] / stats.totalReviews) * 100 || 0
                        }%`,
                      }}
                    />
                  </div>
                  <span>{stats.distribution[star]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeTab === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          En attente ({pendingReviews.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeTab === 'approved'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Approuvés ({approvedReviews.length})
        </button>
      </div>

      {/* Liste des avis */}
      <div className="space-y-4">
        {activeTab === 'pending' ? (
          pendingReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Aucun avis en attente
            </div>
          ) : (
            pendingReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex text-xl">{renderStars(review.rating)}</div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg">{review.title}</h3>
                    <p className="text-sm text-gray-600">
                      Par {review.client?.firstName} {review.client?.lastName}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    En attente
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{review.content}</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(review.id)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    ✓ Approuver
                  </button>
                  <button
                    onClick={() => handleReject(review.id)}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                  >
                    ✕ Rejeter
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          approvedReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex text-xl">{renderStars(review.rating)}</div>
                    {review.isFeatured && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        ⭐ En vedette
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg">{review.title}</h3>
                  <p className="text-sm text-gray-600">
                    Par {review.client?.firstName} {review.client?.lastName}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Approuvé
                </span>
              </div>

              <p className="text-gray-700 mb-4">{review.content}</p>

              <button
                onClick={() => handleToggleFeatured(review.id)}
                className={`px-4 py-2 rounded-lg ${
                  review.isFeatured
                    ? 'bg-gray-300 hover:bg-gray-400'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                {review.isFeatured ? 'Retirer de la vedette' : 'Mettre en vedette'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsModeration;
