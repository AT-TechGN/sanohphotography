import api from './api';

/**
 * Service pour la gestion des employés
 *
 * CORRECTIONS :
 * 1. create() → POST /employees — route ajoutée au backend
 * 2. update() → PUT /employees/:id — route ajoutée au backend
 * 3. delete() → DELETE /employees/:id — route ajoutée au backend (soft delete)
 * 4. Les réponses du backend exposent maintenant firstName/lastName
 *    directement (depuis Employee→User), donc aucun mapping nécessaire
 */
const employeeService = {

  /**
   * Employés actifs
   */
  async getActive() {
    const response = await api.get('/employees/active');
    return response.data;
  },

  /**
   * Un employé par ID
   */
  async getById(id) {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  /**
   * Créer un employé (crée aussi le compte User associé)
   * CORRECTION 1 : route ajoutée au backend
   * Champs : firstName, lastName, email, phone, position, contractType,
   *          hourlyRate, hireDate, specializations, bio, password (optionnel)
   */
  async create(data) {
    const response = await api.post('/employees', data);
    return response.data;
  },

  /**
   * Modifier un employé
   * CORRECTION 2 : route ajoutée au backend
   */
  async update(id, data) {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer (soft delete) un employé
   * CORRECTION 3 : route ajoutée au backend
   */
  async delete(id) {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  /**
   * Disponibilités d'un employé
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
   * Congés/absences d'un employé
   */
  async getBlockedSlots(id, startDate = null, endDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate)   params.end_date   = endDate;
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
   * Planning hebdomadaire
   */
  async getWeeklySchedule(id, weekStart = null) {
    const params = {};
    if (weekStart) params.week_start = weekStart;
    const response = await api.get(`/employees/${id}/weekly-schedule`, { params });
    return response.data;
  },
};

export default employeeService;
