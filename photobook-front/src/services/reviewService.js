import api from './api';

const reviewService = {
  /**
   * Avis approuvés (public)
   */
  async getApproved(page = 1, limit = 10) {
    const response = await api.get('/reviews/approved', { params: { page, limit } });
    return response.data;
  },

  async getHomepageReviews(limit = 3) {
    return this.getApproved(1, limit);
  },

  async getPending() {
    const response = await api.get('/reviews/pending');
    return response.data;
  },

  /**
   * Soumettre un avis
   * BUG CORRIGÉ : l'entité Review a 'content' (pas 'comment')
   * On envoie les deux pour compatibilité avec les deux versions du backend
   */
  async submit(data) {
    const payload = {
      rating:  data.rating,
      comment: data.comment ?? data.content,  // front utilise 'comment'
      content: data.comment ?? data.content,  // backend attend 'content'
      title:   data.title ?? null,
    };
    const response = await api.post('/reviews/submit', payload);
    return response.data;
  },

  async approve(id) {
    const response = await api.patch(`/reviews/${id}/approve`);
    return response.data;
  },

  async reject(id) {
    const response = await api.patch(`/reviews/${id}/reject`);
    return response.data;
  },

  async toggleFeatured(id) {
    const response = await api.patch(`/reviews/${id}/toggle-featured`);
    return response.data;
  },

  async getStats() {
    const response = await api.get('/reviews/stats');
    return response.data;
  },
};

export default reviewService;
