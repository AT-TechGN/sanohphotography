import api from './api';

/**
 * Service pour les réservations
 *
 * CORRECTIONS :
 * 1. getAllBookings() appelait /admin/bookings → 404 (route inexistante)
 *    Corrigé → /bookings/admin-list (nouvelle route ajoutée au backend)
 * 2. updateBookingStatus() appelait /admin/bookings/:id/status → 404
 *    Corrigé → /bookings/:id/admin-status
 * 3. assignEmployee() appelait /admin/bookings/:id/assign → route déjà correcte ✓
 */
const bookingService = {

  /**
   * Créneaux disponibles
   */
  async getAvailableSlots(serviceId, date) {
    const response = await api.get('/bookings/available-slots', {
      params: { service_id: serviceId, date },
    });
    return response.data;
  },

  /**
   * Créer une réservation (client)
   */
  async create(data) {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  /**
   * Réservations du client connecté
   */
  async getMyBookings(status = null) {
    const params = status ? { status } : {};
    const response = await api.get('/bookings/my-bookings', { params });
    return response.data;
  },

  /**
   * Une réservation par ID
   */
  async getById(id) {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  /**
   * Confirmer (photographe)
   */
  async confirm(id) {
    const response = await api.patch(`/bookings/${id}/confirm`);
    return response.data;
  },

  /**
   * Annuler
   */
  async cancel(id, reason) {
    const response = await api.patch(`/bookings/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * Démarrer (employé)
   */
  async start(id) {
    const response = await api.patch(`/bookings/${id}/start`);
    return response.data;
  },

  /**
   * Terminer (employé)
   */
  async complete(id) {
    const response = await api.patch(`/bookings/${id}/complete`);
    return response.data;
  },

  /**
   * Calendrier (photographe)
   */
  async getCalendar(startDate, endDate) {
    const response = await api.get('/bookings/calendar', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  /**
   * Statistiques (photographe)
   */
  async getStats() {
    const response = await api.get('/bookings/stats');
    return response.data;
  },

  /**
   * Toutes les réservations (admin/photographe)
   * CORRECTION 1 : /admin/bookings → /bookings/admin-list
   */
  async getAllBookings(filters = {}) {
    const params = {};
    if (filters.status && filters.status !== 'all') params.status   = filters.status;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate)   params.end_date   = filters.endDate;

    const response = await api.get('/bookings/admin-list', { params });
    return response.data;
  },

  /**
   * Changer le statut (admin)
   * CORRECTION 2 : /admin/bookings/:id/status → /bookings/:id/admin-status
   */
  async updateBookingStatus(id, status) {
    const response = await api.patch(`/bookings/${id}/admin-status`, { status });
    return response.data;
  },

  /**
   * Assigner un employé (admin)
   * Route déjà correcte : /bookings/:id/assign
   */
  async assignEmployee(bookingId, employeeId) {
    const response = await api.patch(`/bookings/${bookingId}/assign`, {
      employee_id: employeeId,
    });
    return response.data;
  },
};

export default bookingService;
