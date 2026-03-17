/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import invoiceService from '../../services/invoiceService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';
import {
  DocumentTextIcon, ArrowDownTrayIcon, CheckCircleIcon,
  XCircleIcon, FunnelIcon, CurrencyDollarIcon,
  ClockIcon, ExclamationCircleIcon, EyeIcon,
} from '@heroicons/react/24/outline';

const InvoicesManagement = () => {
  const [invoices,      setInvoices]      = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [payModal,      setPayModal]      = useState(null); // { id } | null
  const [payMethod,     setPayMethod]     = useState('Mobile Money');
  const [exportDates,   setExportDates]   = useState({ start: '', end: '' });
  const { showSuccess, showError } = useUIStore();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesData, statsData] = await Promise.all([
        invoiceService.getAll(),
        invoiceService.getStats(),
      ]);
      setInvoices(invoicesData ?? []);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      showError('Erreur chargement factures');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPdf = async (id) => {
    try {
      await invoiceService.previewPdf(id);
    } catch (err) {
      console.error(err);
      showError('Erreur aperçu PDF');
    }
  };

  const handleDownloadPdf = async (id, invoiceNumber) => {
    try {
      const blob = await invoiceService.downloadPdf(id);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `facture-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Facture téléchargée');
    } catch (err) {
      console.error(err);
      showError('Erreur téléchargement PDF');
    }
  };

  // BUG CORRIGÉ : prompt() remplacé par une modale inline
  const handleMarkPaid = async () => {
    if (!payModal) return;
    try {
      await invoiceService.markPaid(payModal.id, payMethod);
      showSuccess('Facture marquée comme payée');
      setPayModal(null);
      setPayMethod('Mobile Money');
      loadData();
    } catch (err) {
      console.error(err);
      showError('Erreur');
    }
  };

  const handleCancel = async (id) => {
    // BUG CORRIGÉ : confirm() → window.confirm()
    if (!window.confirm('Annuler cette facture ?')) return;
    try {
      await invoiceService.cancel(id);
      showSuccess('Facture annulée');
      loadData();
    } catch (err) {
      console.error(err);
      showError('Erreur annulation');
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await invoiceService.exportCsv(
        exportDates.start || null,
        exportDates.end   || null,
      );
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `factures-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Export CSV téléchargé');
    } catch (err) {
      console.error(err);
      showError('Erreur export CSV');
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(price);

  const getStatusBadge = (status) => {
    const map = {
      pending:   { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'En attente' },
      paid:      { color: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400',  label: 'Payée'     },
      cancelled: { color: 'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400',    label: 'Annulée'   },
    };
    const { color, label } = map[status] || map.pending;
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{label}</span>;
  };

  const filteredInvoices = filterStatus === 'all'
    ? invoices
    : invoices.filter((inv) => inv.status === filterStatus);

  if (loading) return <Loading fullScreen text="Chargement des factures..." />;

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Factures</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{filteredInvoices.length} facture(s)</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={exportDates.start} onChange={(e) => setExportDates(p => ({ ...p, start: e.target.value }))} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm" />
          <input type="date" value={exportDates.end}   onChange={(e) => setExportDates(p => ({ ...p, end:   e.target.value }))} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm" />
          <button onClick={handleExportCsv} className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
            <ArrowDownTrayIcon className="w-5 h-5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Revenus du mois',    value: formatPrice(stats.monthRevenue),  Icon: CurrencyDollarIcon,   color: 'from-green-500 to-green-600'   },
            { label: 'En attente',         value: formatPrice(stats.pendingAmount), Icon: ClockIcon,            color: 'from-yellow-500 to-yellow-600' },
            { label: 'Factures en retard', value: stats.overdueInvoices,            Icon: ExclamationCircleIcon,color: 'from-red-500 to-red-600'       },
            { label: 'Total factures',     value: Object.values(stats.statusCounts ?? {}).reduce((a, b) => a + b, 0), Icon: DocumentTextIcon, color: 'from-amber-500 to-amber-600' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}>
              <div className="flex items-center justify-between">
                <div><p className="text-white/80 text-sm">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>
                <Icon className="w-10 h-10 text-white/30" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="w-5 h-5 text-amber-600" />
          <span className="font-medium text-gray-900 dark:text-white">Filtrer :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all',       label: `Toutes (${invoices.length})`                                  },
            { value: 'pending',   label: `En attente (${invoices.filter(i => i.status === 'pending').length})`  },
            { value: 'paid',      label: `Payées (${invoices.filter(i => i.status === 'paid').length})`          },
            { value: 'cancelled', label: `Annulées (${invoices.filter(i => i.status === 'cancelled').length})`   },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === value
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                {['N° Facture','Client','Service','Montant','Date','Statut','Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Aucune facture</td></tr>
              ) : filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {invoice.booking?.client?.firstName} {invoice.booking?.client?.lastName}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{invoice.booking?.service?.name}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{formatPrice(invoice.amount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePreviewPdf(invoice.id)} className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Aperçu PDF">
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Télécharger PDF">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                      </button>
                      {invoice.status === 'pending' && (
                        <>
                          <button onClick={() => setPayModal({ id: invoice.id })} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Marquer payée">
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleCancel(invoice.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Annuler">
                            <XCircleIcon className="w-5 h-5" />
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

      {/* Modal paiement — remplace prompt() */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Méthode de paiement</h3>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 mb-4 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {['Mobile Money','Espèces','Virement','Orange Money','MTN Money'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={handleMarkPaid} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                Confirmer
              </button>
              <button onClick={() => setPayModal(null)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesManagement;
