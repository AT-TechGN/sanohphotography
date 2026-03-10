import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../services/bookingService';
import invoiceService from '../services/invoiceService';
import useAuthStore from '../stores/authStore';
import Loading from '../components/common/Loading';

const ClientDashboard = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, invoicesData] = await Promise.all([
        bookingService.getMyBookings(),
        invoiceService.getMyInvoices(),
      ]);
      setBookings(bookingsData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bonjour {user?.firstName} ! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos réservations et consultez votre historique
          </p>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/booking"
            className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <div className="text-3xl mb-2">📅</div>
            <h3 className="text-lg font-bold mb-1">Nouvelle réservation</h3>
            <p className="text-sm text-blue-100">
              Réserver une nouvelle séance photo
            </p>
          </Link>

          <Link
            to="/gallery"
            className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <div className="text-3xl mb-2">📸</div>
            <h3 className="text-lg font-bold mb-1">Galerie</h3>
            <p className="text-sm text-purple-100">
              Parcourir nos réalisations
            </p>
          </Link>

          <div className="bg-green-600 text-white p-6 rounded-lg">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="text-lg font-bold mb-1">Votre avis compte</h3>
            <p className="text-sm text-green-100">
              Laissez-nous un avis après votre séance
            </p>
          </div>
        </div>

        {/* Mes réservations */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Mes réservations</h2>

          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Aucune réservation</p>
              <Link
                to="/booking"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Réserver maintenant
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">
                          {booking.service?.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          📅{' '}
                          {new Date(booking.scheduledDate).toLocaleDateString(
                            'fr-FR'
                          )}{' '}
                          à {booking.scheduledTime}
                        </p>
                        <p>⏱️ {booking.service?.durationMin} minutes</p>
                        {booking.assignedEmployee && (
                          <p>
                            👤 Photographe :{' '}
                            {booking.assignedEmployee.firstName}{' '}
                            {booking.assignedEmployee.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mes factures */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Mes factures</h2>

          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucune facture disponible
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                >
                  <div>
                    <p className="font-bold">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {new Intl.NumberFormat('fr-GN', {
                        style: 'currency',
                        currency: 'GNF',
                        minimumFractionDigits: 0,
                      }).format(invoice.amount)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
