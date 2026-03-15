import api from './api';

const galleryService = {
  /**
   * BUG CORRIGÉ : /gallery → /gallery/photos
   * La route backend est GET /api/gallery/photos (pas /api/gallery)
   */
  async getAll(page = 1, limit = 20) {
    const response = await api.get(`/gallery/photos?page=${page}&limit=${limit}`);
    return response.data;
  },

  /**
   * BUG CORRIGÉ : /gallery?period=... → /gallery/photos?period=...
   */
  async getPhotos(params = {}) {
    const { period = 'all', category, page = 1, limit = 24 } = params;
    const queryParams = new URLSearchParams({ period, page, limit });
    if (category) queryParams.set('category', category);
    const response = await api.get(`/gallery/photos?${queryParams}`);
    return response.data;
  },

  async getFeatured(limit = 10) {
    try {
      const response = await api.get(`/gallery/featured?limit=${limit}`);
      const raw = response.data;
      return Array.isArray(raw) ? { data: raw } : (raw ?? { data: [] });
    } catch (error) {
      console.error('Gallery featured fetch error:', error);
      return { data: [] };
    }
  },

  async getAlbums(page = 1, limit = 12) {
    const response = await api.get(`/gallery/albums?page=${page}&limit=${limit}`);
    return response.data;
  },

  async getStats() {
    try {
      const response = await api.get('/gallery/stats');
      return response.data;
    } catch (error) {
      console.error('Gallery stats fetch error:', error);
      return null;
    }
  },

  /**
   * BUG CORRIGÉ : /albums/:id → /gallery/albums/:id
   */
  async getAlbumById(id) {
    const response = await api.get(`/gallery/albums/${id}`);
    return response.data;
  },
};

export default galleryService;
