import api from './api';

/**
 * Service pour les messages de contact
 */
const contactService = {
  /**
   * Envoyer un message de contact
   */
  async send(data) {
    const response = await api.post('/contact_messages', data);
    return response.data;
  },

  /**
   * Obtenir tous les messages (photographe)
   */
  async getAll(page = 1, limit = 20) {
    const response = await api.get('/contact_messages', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Obtenir les messages non lus (photographe)
   */
  async getUnread() {
    const response = await api.get('/contact_messages/unread');
    return response.data;
  },

  /**
   * Marquer un message comme lu (photographe)
   */
  async markAsRead(id) {
    const response = await api.patch(`/contact_messages/${id}/read`);
    return response.data;
  },

  /**
   * Supprimer un message (photographe)
   */
  async delete(id) {
    const response = await api.delete(`/contact_messages/${id}`);
    return response.data;
  },
};

export default contactService;

