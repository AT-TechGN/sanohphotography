import api from './api';

/**
 * Service pour le dashboard admin
 */
const dashboardService = {
  /**
   * Obtenir les KPIs temps réel
   */
  async getKpis() {
    const response = await api.get('/dashboard/kpis');
    return response.data;
  },

  /**
   * Obtenir les données pour les graphiques
   */
  async getCharts(days = 30) {
    const response = await api.get('/dashboard/charts', {
      params: { days },
    });
    return response.data;
  },

  /**
   * Obtenir le flux d'activité récente
   */
  async getActivityFeed(limit = 20) {
    const response = await api.get('/dashboard/activity-feed', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Obtenir la performance des employés
   */
  async getEmployeePerformance() {
    const response = await api.get('/dashboard/employee-performance');
    return response.data;
  },

  /**
   * Obtenir les statistiques globales de la plateforme
   */
  async getPlatformStats() {
    const response = await api.get('/dashboard/platform-stats');
    return response.data;
  },

  /**
   * Obtenir les prochains événements/rappels
   */
  async getUpcomingEvents() {
    const response = await api.get('/dashboard/upcoming-events');
    return response.data;
  },
};

export default dashboardService;
