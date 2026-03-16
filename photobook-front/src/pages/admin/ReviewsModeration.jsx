/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import reviewService from '../../services/reviewService';
import useUIStore from '../../stores/uiStore';
import {
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  FunnelIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const ReviewsModeration = () => {
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('pending');
  const [stats,    setStats]    = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const { showSuccess, showError } = useUIStore();

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    try {
      setLoading(true);

      // BUG CORRIGÉ : reviewService n'a pas getPendingReviews() ni getAllReviews()
      // Les vraies méthodes sont getPending() et getApproved()
      let data;
      if (filter === 'pending') {
        data = await reviewService.getPending();
      } else if (filter === 'approved') {
        const res = await reviewService.getApproved(1, 50);
        // getApproved retourne { data: [...] } ou directement un tableau
        data = Array.isArray(res) ? res : (res?.data ?? []);
      } else if (filter === 'all') {
        // Combiner pending + approved
        const [pendingRes, approvedRes] = await Promise.all([
          reviewService.getPending(),
          reviewService.getApproved(1, 100),
        ]);
        const approved = Array.isArray(approvedRes) ? approvedRes : (approvedRes?.data ?? []);
        data = [...(Array.isArray(pendingRes) ? pendingRes : []), ...approved];
      } else {
        // filter === 'rejected' — pas d'endpoint dédié, on retourne []
        data = [];
      }

      setReviews(Array.isArray(data) ? data : []);

      // Recalculer les stats avec ce qu'on a
      const [pendingData, approvedData] = await Promise.all([
        reviewService.getPending(),
        reviewService.getApproved(1, 100),
      ]);
      const pendingList  = Array.isArray(pendingData) ? pendingData : [];
      const approvedList = Array.isArray(approvedData) ? approvedData : (approvedData?.data ?? []);
      setStats({
        pending:  pendingList.length,
        approved: approvedList.length,
        rejected: 0,
        total:    pendingList.length + approvedList.length,
      });
    } catch (err) {
      console.error('Erreur chargement avis:', err);
      showError('Erreur chargement des avis');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // BUG CORRIGÉ : approveReview → approve, rejectReview → reject
  const handleApprove = async (id) => {
    try {
      await reviewService.approve(id);
      showSuccess('Avis approuvé');
      loadReviews();
    } catch (err) {
      console.error('Erreur approbation:', err);
      showError('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (id) => {
    try {
      await reviewService.reject(id);
      showSuccess('Avis rejeté');
      loadReviews();
    } catch (err) {
      console.error('Erreur rejet:', err);
      showError('Erreur lors du rejet');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await reviewService.toggleFeatured(id);
      showSuccess('Statut vedette modifié');
      loadReviews();
    } catch (err) {
      console.error('Erreur toggle featured:', err);
      showError('Erreur');
    }
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarSolidIcon
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        label: 'En attente',
        icon: <ClockIcon className="w-4 h-4" />,
      },
      approved: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        label: 'Approuvé',
        icon: <CheckCircleIcon className="w-4 h-4" />,
      },
      rejected: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        label: 'Rejeté',
        icon: <XCircleIcon className="w-4 h-4" />,
      },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.icon}{badge.label}
      </span>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Modération des Avis</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{reviews.length} avis trouvé(s)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'En attente', value: stats.pending,  color: 'from-yellow-500 to-yellow-600' },
          { label: 'Approuvés',  value: stats.approved, color: 'from-green-500 to-green-600'  },
          { label: 'Rejetés',    value: stats.rejected, color: 'from-red-500 to-red-600'      },
          { label: 'Total',      value: stats.total,    color: 'from-amber-500 to-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}>
            <p className="text-white/80 text-sm">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtres</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'pending',  label: 'En attente', count: stats.pending  },
            { value: 'approved', label: 'Approuvés',  count: stats.approved },
            { value: 'all',      label: 'Tous',       count: stats.total    },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === item.value
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto" />
            <p className="mt-4 text-gray-500">Chargement...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <ChatBubbleLeftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun avis trouvé</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Client Info */}
                <div className="flex items-start gap-4 lg:w-1/3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {review.client?.firstName?.[0]}{review.client?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {review.client?.firstName} {review.client?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{review.client?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    {renderStars(review.rating)}
                    {getStatusBadge(review.status)}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {review.comment || review.content}
                  </p>
                  {review.service && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <span className="text-sm text-amber-700 dark:text-amber-400">
                        Service: {review.service?.name || review.service}
                      </span>
                    </div>
                  )}
                  {/* Vedette toggle */}
                  {review.status === 'approved' && (
                    <button
                      onClick={() => handleToggleFeatured(review.id)}
                      className={`mt-3 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        review.isFeatured
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <StarIcon className="w-4 h-4" />
                      {review.isFeatured ? 'Retirer de la vedette' : 'Mettre en vedette'}
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2">
                  {review.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Approuver</span>
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Rejeter</span>
                      </button>
                    </>
                  )}
                  {review.status === 'approved' && (
                    <button
                      onClick={() => handleReject(review.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Retirer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsModeration;
