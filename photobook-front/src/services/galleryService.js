import api from './api';

/**
 * Service pour la galerie photos
 */
const galleryService = {
  /**
   * Obtenir toutes les photos (pour la page d'accueil)
   */
  async getAll(page = 1, limit = 20) {
    const response = await api.get(`/gallery?page=${page}&limit=${limit}`);
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
    const response = await api.get(`/gallery?${queryParams}`);
    return response.data;
  },

  /**
   * Obtenir les photos en vedette
   * CORRECTION 3 : normalisation de la réponse pour garantir le format { data: [] }
   * que les composants attendent. L'API peut retourner soit { data: [...] }
   * soit directement un tableau — on normalise ici pour éviter les crashes
   * du type "Cannot read properties of undefined (reading 'length')".
   */
  async getFeatured(limit = 10) {
    try {
      const response = await api.get(`/gallery/featured?limit=${limit}`);
      // Normalisation : si response.data est un tableau direct, on l'encapsule
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
    const response = await api.get(`/gallery/albums?page=${page}&limit=${limit}`);
    return response.data;
  },

  /**
   * Obtenir les statistiques de la galerie
   * CORRECTION 4 : getStats n'avait pas de try/catch contrairement à getFeatured.
   * Un crash ici faisait planter tout le Promise.all() de loadData dans HomePage.
   */
  async getStats() {
    try {
      const response = await api.get('/gallery/stats');
      return response.data;
    } catch (error) {
      console.error('Gallery stats fetch error:', error);
      return null; // les composants testent déjà `if (res)` avant d'utiliser les données
    }
  },

  /**
   * Obtenir un album par ID
   * CORRECTION 5 : route "/albums/:id" → "/gallery/albums/:id"
   * Toutes les routes publiques de ce service sont sous /gallery/,
   * l'ancienne route était incohérente et retournait un 404.
   */
  async getAlbumById(id) {
    const response = await api.get(`/gallery/albums/${id}`);
    return response.data;
  },
};

export default galleryService;
