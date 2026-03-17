import { useEffect, useState, useCallback, useRef } from 'react';
import invoiceService from '../../services/invoiceService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';
import InvoicePDF, { useInvoicePDF } from '../../components/common/InvoicePDF';
import {
  DocumentTextIcon, ArrowDownTrayIcon, CheckCircleIcon,
  XCircleIcon, FunnelIcon, CurrencyDollarIcon, EyeIcon,
  ClockIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const InvoicesManagement = () => {
  const [invoices,     setInvoices]     = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [payModal,     setPayModal]     = useState(null);
  const [payMethod,    setPayMethod]    = useState('Mobile Money');
  const [pdfLoading,   setPdfLoading]   = useState(null); // id facture en cours
  const [currentInvoice, setCurrentInvoice] = useState(null); // pour le template PDF

  const { showSuccess, showError } = useUIStore();
  const { templateRef, generate }  = useInvoicePDF();

  const loadData = useCallback(async () => {
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
  }, [showError]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Génération PDF côté frontend ──────────────────────────────────────── */
  const handlePdf = async (invoice, mode = 'download') => {
    setPdfLoading(invoice.id);
    try {
      // Charger les détails complets si nécessaire
      let full = invoice;
      if (!invoice.booking?.client?.email) {
        try { full = await invoiceService.getById(invoice.id); } catch { /* utiliser ce qu'on a */ }
      }
      setCurrentInvoice(full);

      // Attendre que React rende le composant avec les nouvelles données
      await new Promise(r => setTimeout(r, 80));
      await generate(full, mode);
      showSuccess(mode === 'preview' ? 'PDF ouvert' : 'Facture téléchargée');
    } catch (err) {
      console.error(err);
      showError('Erreur génération PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  /* ── Marquer payée ─────────────────────────────────────────────────────── */
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

  /* ── Annuler ───────────────────────────────────────────────────────────── */
  const handleCancel = async (id) => {
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

  const formatPrice = (v) =>
    new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(Number(v ?? 0));

  const getStatusBadge = (status) => {
    const map = {
      pending:   { cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'En attente' },
      paid:      { cls: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400',  label: 'Payée'      },
      cancelled: { cls: 'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400',    label: 'Annulée'    },
    };
    const { cls, label } = map[status] ?? map.pending;
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
  };

  const filtered = filterStatus === 'all'
    ? invoices
    : invoices.filter(i => i.status === filterStatus);

  if (loading) return <Loading fullScreen text="Chargement des factures..." />;

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-6">

      {/* Template PDF hors écran — rendu pour la capture html2canvas */}
      <InvoicePDF invoice={currentInvoice} templateRef={templateRef} />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Factures</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} facture(s)</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Revenus du mois',    value: formatPrice(stats.monthRevenue),  Icon: CurrencyDollarIcon,    color: 'from-green-500  to-green-600'  },
            { label: 'En attente',         value: formatPrice(stats.pendingAmount), Icon: ClockIcon,             color: 'from-yellow-500 to-yellow-600' },
            { label: 'Factures en retard', value: stats.overdueInvoices ?? 0,       Icon: ExclamationCircleIcon, color: 'from-red-500    to-red-600'    },
            { label: 'Total factures',     value: invoices.length,                  Icon: DocumentTextIcon,      color: 'from-amber-500  to-amber-600'  },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
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
            { value: 'all',       label: `Toutes (${invoices.length})`                                           },
            { value: 'pending',   label: `En attente (${invoices.filter(i => i.status === 'pending').length})`   },
            { value: 'paid',      label: `Payées (${invoices.filter(i => i.status === 'paid').length})`          },
            { value: 'cancelled', label: `Annulées (${invoices.filter(i => i.status === 'cancelled').length})`   },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilterStatus(value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
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
                {['N° Facture', 'Client', 'Service', 'Montant TTC', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Aucune facture
                  </td>
                </tr>
              ) : filtered.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-4 font-mono font-medium text-gray-900 dark:text-white text-sm">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-4 py-4 text-gray-700 dark:text-gray-300 text-sm">
                    {invoice.booking?.client?.firstName} {invoice.booking?.client?.lastName}
                  </td>
                  <td className="px-4 py-4 text-gray-700 dark:text-gray-300 text-sm">
                    {invoice.booking?.service?.name ?? '—'}
                  </td>
                  <td className="px-4 py-4 font-bold text-gray-900 dark:text-white text-sm">
                    {formatPrice(invoice.amountTtc ?? invoice.amount)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {invoice.issuedAt
                      ? new Date(invoice.issuedAt).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(invoice.status)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">

                      {/* Aperçu PDF */}
                      <button
                        type="button"
                        onClick={() => handlePdf(invoice, 'preview')}
                        disabled={pdfLoading === invoice.id}
                        title="Aperçu PDF"
                        className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {pdfLoading === invoice.id
                          ? <span className="block w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                          : <EyeIcon className="w-4 h-4" />
                        }
                      </button>

                      {/* Télécharger PDF */}
                      <button
                        type="button"
                        onClick={() => handlePdf(invoice, 'download')}
                        disabled={pdfLoading === invoice.id}
                        title="Télécharger PDF"
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-40"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>

                      {invoice.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPayModal({ id: invoice.id })}
                            title="Marquer payée"
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancel(invoice.id)}
                            title="Annuler"
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <XCircleIcon className="w-4 h-4" />
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

      {/* Modal paiement */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Méthode de paiement</h3>
            <select
              value={payMethod}
              onChange={e => setPayMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {['Mobile Money', 'Espèces', 'Virement', 'Orange Money', 'MTN Money'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleMarkPaid}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Confirmer
              </button>
              <button
                type="button"
                onClick={() => setPayModal(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
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
