import api from './api';

/**
 * Service pour la gestion des employés
 */
const employeeService = {
  /**
   * Obtenir tous les employés actifs
   */
  async getActive() {
    const response = await api.get('/employees/active');
    return response.data;
  },

  /**
   * Obtenir un employé par ID
   */
  async getById(id) {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  /**
   * Créer un nouvel employé
   */
  async create(data) {
    const response = await api.post('/employees', data);
    return response.data;
  },

  /**
   * Mettre à jour un employé
   */
  async update(id, data) {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un employé
   */
  async delete(id) {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  /**
   * Obtenir les disponibilités d'un employé
   */
  async getAvailabilities(id) {
    const response = await api.get(`/employees/${id}/availabilities`);
    return response.data;
  },

  /**
   * Ajouter une disponibilité
   */
  async addAvailability(id, data) {
    const response = await api.post(`/employees/${id}/availabilities`, data);
    return response.data;
  },

  /**
   * Supprimer une disponibilité
   */
  async deleteAvailability(availabilityId) {
    const response = await api.delete(`/employees/availabilities/${availabilityId}`);
    return response.data;
  },

  /**
   * Obtenir les congés/absences d'un employé
   */
  async getBlockedSlots(id, startDate = null, endDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get(`/employees/${id}/blocked-slots`, { params });
    return response.data;
  },

  /**
   * Ajouter un congé/absence
   */
  async addBlockedSlot(id, data) {
    const response = await api.post(`/employees/${id}/blocked-slots`, data);
    return response.data;
  },

  /**
   * Supprimer un congé/absence
   */
  async deleteBlockedSlot(slotId) {
    const response = await api.delete(`/employees/blocked-slots/${slotId}`);
    return response.data;
  },

  /**
   * Obtenir le planning hebdomadaire d'un employé
   */
  async getWeeklySchedule(id, weekStart = null) {
    const params = {};
    if (weekStart) params.week_start = weekStart;

    const response = await api.get(`/employees/${id}/weekly-schedule`, { params });
    return response.data;
  },
};

export default employeeService;
