import api from './api';

/**
 * Service pour les réservations
 */
const bookingService = {
  /**
   * Obtenir les créneaux disponibles pour un service à une date donnée
   */
  async getAvailableSlots(serviceId, date) {
    const response = await api.get('/bookings/available-slots', {
      params: { service_id: serviceId, date },
    });
    return response.data;
  },

  /**
   * Créer une nouvelle réservation
   */
  async create(data) {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  /**
   * Obtenir les réservations du client connecté
   */
  async getMyBookings(status = null) {
    const params = status ? { status } : {};
    const response = await api.get('/bookings/my-bookings', { params });
    return response.data;
  },

  /**
   * Obtenir une réservation par ID
   */
  async getById(id) {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  /**
   * Confirmer une réservation (photographe)
   */
  async confirm(id) {
    const response = await api.patch(`/bookings/${id}/confirm`);
    return response.data;
  },

  /**
   * Annuler une réservation
   */
  async cancel(id, reason) {
    const response = await api.patch(`/bookings/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * Démarrer une séance (employé)
   */
  async start(id) {
    const response = await api.patch(`/bookings/${id}/start`);
    return response.data;
  },

  /**
   * Terminer une séance (employé)
   */
  async complete(id) {
    const response = await api.patch(`/bookings/${id}/complete`);
    return response.data;
  },

  /**
   * Obtenir les réservations pour le calendrier (photographe)
   */
  async getCalendar(startDate, endDate) {
    const response = await api.get('/bookings/calendar', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  /**
   * Obtenir les statistiques des réservations (photographe)
   */
  async getStats() {
    const response = await api.get('/bookings/stats');
    return response.data;
  },

  /**
   * Obtenir toutes les réservations (admin/photographe)
   */
  async getAllBookings(filters = {}) {
    const params = {};
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    
    const response = await api.get('/admin/bookings', { params });
    return response.data;
  },

  /**
   * Mettre à jour le statut d'une réservation
   */
  async updateBookingStatus(id, status) {
    const response = await api.patch(`/admin/bookings/${id}/status`, { status });
    return response.data;
  },

  /**
   * Assigner un employé à une réservation
   */
  async assignEmployee(bookingId, employeeId) {
    const response = await api.patch(`/admin/bookings/${bookingId}/assign`, { employee_id: employeeId });
    return response.data;
  },
};

export default bookingService;
