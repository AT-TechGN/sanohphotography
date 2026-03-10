import api from './api';

/**
 * Service pour la gestion des services photographiques
 */
const serviceService = {
  /**
   * Obtenir tous les services actifs
   */
  async getActive() {
    const response = await api.get('/services/active');
    return response.data;
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
    const response = await api.get('/services/categories');
    return response.data;
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
