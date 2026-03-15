import api from './api';

/**
 * Service pour la gestion des photos et albums (Admin)
 */
const photoService = {
  /**
   * Obtenir tous les albums
   * CORRECTION 1 : routes getAlbums et getAlbum avaient un préfixe /api/ en trop
   * ("/api/admin/albums") incohérent avec toutes les autres routes ("/admin/...").
   * Uniformisé en "/admin/albums" comme le reste du service.
   */
  async getAlbums(params = {}) {
    const { category, isPublic } = params;
    const queryParams = new URLSearchParams({
      ...(category && { category }),
      ...(isPublic !== undefined && { isPublic }),
    });
    const response = await api.get(`/admin/albums?${queryParams}`);
    return response.data;
  },

  /**
   * Obtenir un album par ID
   * CORRECTION 2 : même bug /api/ en trop → "/admin/albums/:id"
   */
  async getAlbum(id) {
    const response = await api.get(`/admin/albums/${id}`);
    return response.data;
  },

  /**
   * Créer un album
   */
  async createAlbum(data) {
    const response = await api.post('/admin/albums', data);
    return response.data;
  },

  /**
   * Mettre à jour un album
   */
  async updateAlbum(id, data) {
    const response = await api.put(`/admin/albums/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un album
   */
  async deleteAlbum(id) {
    const response = await api.delete(`/admin/albums/${id}`);
    return response.data;
  },

  /**
   * Obtenir toutes les photos
   */
  async getPhotos(params = {}) {
    const { albumId } = params;
    const queryParams = new URLSearchParams({
      ...(albumId && { albumId }),
    });
    const response = await api.get(`/admin/photos?${queryParams}`);
    return response.data;
  },

  /**
   * Obtenir une photo par ID
   */
  async getPhoto(id) {
    const response = await api.get(`/admin/photos/${id}`);
    return response.data;
  },

  /**
   * Uploader des photos
   */
  async uploadPhotos(albumId, files) {
    const formData = new FormData();
    formData.append('albumId', albumId);
    files.forEach((file) => {
      formData.append('files', file);
    });
    const response = await api.post('/admin/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Mettre à jour une photo
   */
  async updatePhoto(id, data) {
    const response = await api.put(`/admin/photos/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer une photo
   */
  async deletePhoto(id) {
    const response = await api.delete(`/admin/photos/${id}`);
    return response.data;
  },

  /**
   * Obtenir tous les tags
   */
  async getTags() {
    const response = await api.get('/admin/tags');
    return response.data;
  },

  /**
   * Créer un tag
   */
  async createTag(name) {
    const response = await api.post('/admin/tags', { name });
    return response.data;
  },

  /**
   * Obtenir les réservations pour association album
   */
  async getBookingsForAlbum() {
    const response = await api.get('/admin/bookings/for-album');
    return response.data;
  },

  /**
   * Obtenir les statistiques photos
   */
  async getStats() {
    const response = await api.get('/admin/photos/stats');
    return response.data;
  },
};

export default photoService;