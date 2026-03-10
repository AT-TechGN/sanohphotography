import { useEffect, useState } from 'react';
import invoiceService from '../../services/invoiceService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';

const InvoicesManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const { showSuccess, showError } = useUIStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesData, statsData] = await Promise.all([
        invoiceService.getAll(),
        invoiceService.getStats(),
      ]);
      setInvoices(invoicesData);
      setStats(statsData);
    } catch (error) {
      showError('Erreur chargement factures');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (id, invoiceNumber) => {
    try {
      const blob = await invoiceService.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Facture téléchargée');
    } catch (error) {
      showError('Erreur téléchargement PDF');
    }
  };

  const handleMarkPaid = async (id) => {
    const method = prompt('Méthode de paiement (Mobile Money, Espèces, Virement):');
    if (!method) return;

    try {
      await invoiceService.markPaid(id, method);
      showSuccess('Facture marquée comme payée');
      loadData();
    } catch (error) {
      showError('Erreur');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Annuler cette facture ?')) return;

    try {
      await invoiceService.cancel(id);
      showSuccess('Facture annulée');
      loadData();
    } catch (error) {
      showError('Erreur annulation');
    }
  };

  const handleExportCsv = async () => {
    const startDate = prompt('Date début (YYYY-MM-DD) ou vide pour toutes:');
    const endDate = prompt('Date fin (YYYY-MM-DD) ou vide pour toutes:');

    try {
      const blob = await invoiceService.exportCsv(startDate || null, endDate || null);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factures-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Export CSV téléchargé');
    } catch (error) {
      showError('Erreur export CSV');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      paid: 'Payée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const filteredInvoices =
    filterStatus === 'all'
      ? invoices
      : invoices.filter((inv) => inv.status === filterStatus);

  if (loading) return <Loading fullScreen />;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des Factures</h1>
        <button
          onClick={handleExportCsv}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm mb-2">Revenus du mois</p>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(stats.monthRevenue)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm mb-2">Montant en attente</p>
            <p className="text-2xl font-bold text-yellow-600">
              {formatPrice(stats.pendingAmount)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm mb-2">Factures en retard</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm mb-2">Total factures</p>
            <p className="text-2xl font-bold text-blue-600">
              {Object.values(stats.statusCounts).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-6 py-3 rounded-lg font-medium ${
            filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Toutes ({invoices.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-6 py-3 rounded-lg font-medium ${
            filterStatus === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200'
          }`}
        >
          En attente ({invoices.filter((i) => i.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilterStatus('paid')}
          className={`px-6 py-3 rounded-lg font-medium ${
            filterStatus === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}
        >
          Payées ({invoices.filter((i) => i.status === 'paid').length})
        </button>
      </div>

      {/* Liste des factures */}
      <div className="bg-white rounded-lg shadow-lg">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                N° Facture
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{invoice.invoiceNumber}</td>
                <td className="px-6 py-4">
                  {invoice.booking?.client?.firstName} {invoice.booking?.client?.lastName}
                </td>
                <td className="px-6 py-4">{invoice.booking?.service?.name}</td>
                <td className="px-6 py-4 font-bold">{formatPrice(invoice.amount)}</td>
                <td className="px-6 py-4 text-sm">
                  {new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Télécharger PDF"
                    >
                      📄
                    </button>
                    {invoice.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleMarkPaid(invoice.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Marquer comme payée"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleCancel(invoice.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Annuler"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicesManagement;
