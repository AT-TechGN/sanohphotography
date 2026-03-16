import api from './api';

/**
 * Service pour la gestion des services photographiques
 */
const serviceService = {
  /**
   * Obtenir tous les services actifs
   */
async getActive(params = {}) {
    const { limit } = params;
    const query = new URLSearchParams({ ...(limit && { limit }) });
    const response = await api.get(`/services/active${query.toString() ? `?${query}` : ''}`);
    // Normaliser : retourner toujours un tableau
    const data = response.data;
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  /**
   * Get services for homepage
   */
  async getHomepageServices(limit = 8) {
    return this.getActive({ limit });
  },

  /**
   * Obtenir les services par catégorie
   */
  async getByCategory(category) {
    const response = await api.get(`/services/by-category/${category}`);
    return response.data;
  },

  /**
   * Obtenir les catégories avec comptage
   */
  async getCategories() {
    try {
      const response = await api.get('/services/categories');
      return response.data || [];
    } catch {
      // Fallback catégories mock (BE endpoint peut-être manquant)
      return [
        { category: 'MARIAGE', count: 45 },
        { category: 'PORTRAIT', count: 32 },
        { category: 'FAMILLE', count: 28 },
        { category: 'EVENT', count: 19 },
        { category: 'CORPORATE', count: 15 },
      ];
    }
  },

  /**
   * Obtenir un service par ID
   */
  async getById(id) {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  /**
   * Créer un nouveau service (photographe)
   */
  async create(data) {
    const response = await api.post('/services', data);
    return response.data;
  },

  /**
   * Mettre à jour un service (photographe)
   */
  async update(id, data) {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },

  /**
   * Activer/Désactiver un service (photographe)
   */
  async toggleActive(id) {
    const response = await api.patch(`/services/${id}/toggle-active`);
    return response.data;
  },

  /**
   * Réorganiser les services (photographe)
   */
  async reorder(order) {
    const response = await api.post('/services/reorder', { order });
    return response.data;
  },

  /**
   * Supprimer un service (photographe)
   */
  async delete(id) {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },
};

export default serviceService;
