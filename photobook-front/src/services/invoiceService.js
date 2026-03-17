import api from './api';

/**
 * Service pour la facturation
 *
 * CORRECTION : getAll() appelait GET /invoices → 404 (route inexistante)
 * Le backend avait seulement /invoices/my-invoices et /invoices/stats.
 * Corrigé → GET /invoices (nouvelle route ajoutée dans InvoiceController)
 */
const invoiceService = {

  /**
   * Toutes les factures (admin)
   * CORRECTION : route /invoices ajoutée au backend
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.page)  query.set('page',  params.page);
    if (params.limit) query.set('limit', params.limit);

    const response = await api.get(`/invoices${query.toString() ? `?${query}` : ''}`);
    // La nouvelle route retourne { data: [...], pagination: {...} }
    // Pour compatibilité avec le code existant qui attendait un tableau direct,
    // on retourne data si présent, sinon la réponse directe
    return Array.isArray(response.data) ? response.data : (response.data?.data ?? response.data);
  },

  /**
   * Une facture par ID
   */
  async getById(id) {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Créer une facture (admin)
   */
  async create(data) {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  /**
   * Générer une facture pour une réservation terminée
   */
  async generateForBooking(bookingId) {
    const response = await api.post(`/invoices/generate/${bookingId}`);
    return response.data;
  },

  /**
   * PDF généré côté frontend via jsPDF + html2canvas (InvoicePDF.jsx)
   * Ces méthodes ne sont plus nécessaires — voir useInvoicePDF()
   */

  /**
   * Marquer comme payée (admin)
   */
  async markPaid(id, paymentMethod) {
    const response = await api.patch(`/invoices/${id}/mark-paid`, {
      payment_method: paymentMethod,
    });
    return response.data;
  },

  /**
   * Annuler (admin)
   */
  async cancel(id) {
    const response = await api.patch(`/invoices/${id}/cancel`);
    return response.data;
  },

  /**
   * Factures du client connecté
   */
  async getMyInvoices() {
    const response = await api.get('/invoices/my-invoices');
    return response.data;
  },

  /**
   * Statistiques (admin)
   */
  async getStats() {
    const response = await api.get('/invoices/stats');
    return response.data;
  },

  /**
   * Export CSV (admin)
   */
  async exportCsv(startDate = null, endDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate)   params.end_date   = endDate;

    const response = await api.get('/invoices/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default invoiceService;
