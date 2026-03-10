import api from './api';

/**
 * Service pour la facturation
 */
const invoiceService = {
  /**
   * Créer une facture (admin)
   */
  async create(data) {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  /**
   * Télécharger une facture en PDF
   */
  async downloadPdf(id) {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Marquer une facture comme payée (admin)
   */
  async markPaid(id, paymentMethod) {
    const response = await api.patch(`/invoices/${id}/mark-paid`, {
      payment_method: paymentMethod,
    });
    return response.data;
  },

  /**
   * Annuler une facture (admin)
   */
  async cancel(id) {
    const response = await api.patch(`/invoices/${id}/cancel`);
    return response.data;
  },

  /**
   * Obtenir les factures du client connecté
   */
  async getMyInvoices() {
    const response = await api.get('/invoices/my-invoices');
    return response.data;
  },

  /**
   * Obtenir les statistiques des factures (admin)
   */
  async getStats() {
    const response = await api.get('/invoices/stats');
    return response.data;
  },

  /**
   * Exporter les factures en CSV (admin)
   */
  async exportCsv(startDate = null, endDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get('/invoices/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Obtenir toutes les factures (admin)
   */
  async getAll() {
    const response = await api.get('/invoices');
    return response.data;
  },

  /**
   * Obtenir une facture par ID
   */
  async getById(id) {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },
};

export default invoiceService;
