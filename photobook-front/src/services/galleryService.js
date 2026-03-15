import api from './api';

/**
 * Service pour la galerie photos
 */
const galleryService = {
  /**
   * Obtenir toutes les photos (pour la page d'accueil)
   */
  async getAll(page = 1, limit = 20) {
    const response = await api.get(`/api/gallery/photos?page=${page}&limit=${limit}`);
    return response.data;
  },

  /**
   * Obtenir les photos de la galerie avec filtres
   */
  async getPhotos(params = {}) {
    const { period = 'all', category, page = 1, limit = 24 } = params;
    const queryParams = new URLSearchParams({
      period,
      page,
      limit,
      ...(category && { category }),
    });
    const response = await api.get(`/api/gallery/photos?${queryParams}`);
    return response.data;
  },

  /**
   * Obtenir les photos en vedette
   */
  async getFeatured(limit = 10) {
    try {
      const response = await api.get(`/api/gallery/featured?limit=${limit}`);
      const raw = response.data;
      return Array.isArray(raw) ? { data: raw } : raw ?? { data: [] };
    } catch (error) {
      console.error('Gallery featured fetch error:', error);
      return { data: [] };
    }
  },

  /**
   * Obtenir les albums publics
   */
  async getAlbums(page = 1, limit = 12) {
    const response = await api.get(`/api/gallery/albums?page=${page}&limit=${limit}`);
    return response.data;
  },

  /**
   * Obtenir les statistiques de la galerie
   */
  async getStats() {
    try {
      const response = await api.get('/api/gallery/stats');
      return response.data;
    } catch (error) {
      console.error('Gallery stats fetch error:', error);
      return null;
    }
  },

  /**
   * Obtenir un album par ID
   */
  async getAlbumById(id) {
    const response = await api.get(`/api/gallery/albums/${id}`);
    return response.data;
  },
};

export default galleryService;

