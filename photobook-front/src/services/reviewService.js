import api from './api';

/**
 * Service pour les avis clients
 */
const reviewService = {
  /**
   * Obtenir les avis approuvés (public)
   */
async getApproved(page = 1, limit = 10) {
    const response = await api.get('/reviews/approved', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get featured/approved reviews for homepage
   */
  async getHomepageReviews(limit = 3) {
    return this.getApproved(1, limit);
  },

  /**
   * Obtenir les avis en attente de modération (photographe)
   */
  async getPending() {
    const response = await api.get('/reviews/pending');
    return response.data;
  },

  /**
   * Soumettre un nouvel avis (client)
   */
  async submit(data) {
    const response = await api.post('/reviews/submit', data);
    return response.data;
  },

  /**
   * Approuver un avis (photographe)
   */
  async approve(id) {
    const response = await api.patch(`/reviews/${id}/approve`);
    return response.data;
  },

  /**
   * Rejeter un avis (photographe)
   */
  async reject(id) {
    const response = await api.patch(`/reviews/${id}/reject`);
    return response.data;
  },

  /**
   * Mettre en vedette / retirer de la vedette (photographe)
   */
  async toggleFeatured(id) {
    const response = await api.patch(`/reviews/${id}/toggle-featured`);
    return response.data;
  },

  /**
   * Obtenir les statistiques des avis
   */
  async getStats() {
    const response = await api.get('/reviews/stats');
    return response.data;
  },
};

export default reviewService;
