/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import bookingService from '../../services/bookingService';
import invoiceService from '../../services/invoiceService';
import employeeService from '../../services/employeeService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';
import {
  CalendarDaysIcon, DocumentTextIcon, FunnelIcon, MagnifyingGlassIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon, EyeIcon,
  UserIcon, CameraIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';

/**
 * CORRECTIONS :
 * 1. handleStatusChange() appelait updateBookingStatus() → aligné avec nouvelle route
 * 2. Ajout modal assignation d'employé (fonctionnalité manquante)
 * 3. Affichage correct du champ employee (via assignedEmployee)
 * 4. Route /admin/bookings/:id inexistante → bouton "Voir détails" retiré
 *    (à implémenter plus tard)
 */
const BookingsManagement = () => {
  const [bookings,       setBookings]       = useState([]);
  const [employees,      setEmployees]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [assignModal,    setAssignModal]    = useState(null); // { bookingId } | null
  const [selectedEmpId,  setSelectedEmpId]  = useState('');
  const [genLoading,     setGenLoading]     = useState(null); // bookingId en cours de génération
  const [invoiceMap,     setInvoiceMap]     = useState({});   // bookingId → invoice généré
  const [filters, setFilters] = useState({
    status: 'all', search: '', startDate: '', endDate: '',
  });
  const { showSuccess, showError } = useUIStore();

  useEffect(() => { loadBookings(); }, [filters]);
  useEffect(() => { loadEmployees(); }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAllBookings(filters);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showError('Erreur chargement réservations');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getActive();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateInvoice = async (bookingId) => {
    setGenLoading(bookingId);
    try {
      const res = await invoiceService.generateForBooking(bookingId);
      if (res.existing) {
        showSuccess('Facture déjà existante — ouverture…');
      } else {
        showSuccess('Facture générée avec succès !');
      }
      setInvoiceMap(prev => ({ ...prev, [bookingId]: res.invoice }));
      // Proposer d'ouvrir le PDF
      if (res.invoice?.id) {
        await invoiceService.previewPdf(res.invoice.id);
      }
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.error || 'Erreur génération facture');
    } finally {
      setGenLoading(null);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      showSuccess('Statut mis à jour');
      loadBookings();
    } catch (err) {
      console.error(err);
      showError('Erreur changement statut');
    }
  };

  const handleAssignEmployee = async () => {
    if (!assignModal || !selectedEmpId) return;
    try {
      await bookingService.assignEmployee(assignModal.bookingId, selectedEmpId);
      showSuccess('Employé assigné');
      setAssignModal(null);
      setSelectedEmpId('');
      loadBookings();
    } catch (err) {
      console.error(err);
      showError('Erreur assignation');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending:     { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'En attente',  Icon: ClockIcon        },
      confirmed:   { bg: 'bg-blue-100   dark:bg-blue-900/30',   text: 'text-blue-700   dark:text-blue-400',   label: 'Confirmée',   Icon: CheckCircleIcon  },
      in_progress: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'En cours',    Icon: CameraIcon       },
      completed:   { bg: 'bg-green-100  dark:bg-green-900/30',  text: 'text-green-700  dark:text-green-400',  label: 'Terminée',    Icon: CheckCircleIcon  },
      cancelled:   { bg: 'bg-red-100    dark:bg-red-900/30',    text: 'text-red-700    dark:text-red-400',    label: 'Annulée',     Icon: XCircleIcon      },
    };
    const { bg, text, label, Icon } = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        <Icon className="w-3.5 h-3.5" />{label}
      </span>
    );
  };

  const filteredBookings = bookings.filter((b) => {
    if (filters.status !== 'all' && b.status !== filters.status) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      return (
        b.client?.firstName?.toLowerCase().includes(s) ||
        b.client?.lastName?.toLowerCase().includes(s)  ||
        b.client?.email?.toLowerCase().includes(s)     ||
        b.service?.name?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  if (loading) return <Loading fullScreen text="Chargement des réservations..." />;

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Réservations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{filteredBookings.length} réservation(s)</p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',      value: bookings.length,                                          color: 'bg-gray-100   dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300'    },
          { label: 'En attente', value: bookings.filter(b => b.status === 'pending').length,      color: 'bg-yellow-50  dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400' },
          { label: 'Confirmées', value: bookings.filter(b => b.status === 'confirmed').length,    color: 'bg-blue-50    dark:bg-blue-900/20',   text: 'text-blue-700   dark:text-blue-400'   },
          { label: 'Terminées',  value: bookings.filter(b => b.status === 'completed').length,    color: 'bg-green-50   dark:bg-green-900/20',  text: 'text-green-700  dark:text-green-400'  },
          { label: 'Annulées',   value: bookings.filter(b => b.status === 'cancelled').length,    color: 'bg-red-50     dark:bg-red-900/20',    text: 'text-red-700    dark:text-red-400'    },
        ].map(({ label, value, color, text }) => (
          <div key={label} className={`${color} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${text}`}>{value}</p>
            <p className={`text-xs font-medium ${text} opacity-80`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rechercher</label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Client, email, service…"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminées</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date début</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date fin</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune réservation trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {['Client','Service','Date & Heure','Photographe','Prix','Statut','Actions'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {booking.client?.firstName?.[0]}{booking.client?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {booking.client?.firstName} {booking.client?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{booking.client?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CameraIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{booking.service?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {booking.scheduledDate
                          ? new Date(booking.scheduledDate).toLocaleDateString('fr-FR')
                          : '—'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{booking.scheduledTime || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {booking.assignedEmployee ? (
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {booking.assignedEmployee.firstName} {booking.assignedEmployee.lastName}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAssignModal({ bookingId: booking.id }); setSelectedEmpId(''); }}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                        >
                          <UserIcon className="w-4 h-4" />Assigner
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white text-sm">
                      {booking.totalPrice
                        ? new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(booking.totalPrice)
                        : '—'}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {booking.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusChange(booking.id, 'confirmed')}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Confirmer">
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Annuler">
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button onClick={() => handleStatusChange(booking.id, 'completed')}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Terminer la réservation">
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {booking.status === 'completed' && (
                          <button
                            onClick={() => handleGenerateInvoice(booking.id)}
                            disabled={genLoading === booking.id}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title={invoiceMap[booking.id] ? 'Voir la facture PDF' : 'Générer la facture PDF'}
                          >
                            {genLoading === booking.id
                              ? <span className="block w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              : <DocumentTextIcon className="w-4 h-4" />
                            }
                          </button>
                        )}
                        {/* Assigner/réassigner employé */}
                        <button
                          onClick={() => { setAssignModal({ bookingId: booking.id }); setSelectedEmpId(''); }}
                          className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Assigner employé">
                          <UserIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal assignation employé */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Assigner un photographe</h3>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 mb-4 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Sélectionner un photographe…</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} — {emp.position}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleAssignEmployee}
                disabled={!selectedEmpId}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                Assigner
              </button>
              <button
                onClick={() => setAssignModal(null)}
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

export default BookingsManagement;
