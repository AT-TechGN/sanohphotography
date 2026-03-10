import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import Loading from '../components/common/Loading';

const AdminDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpisData, eventsData] = await Promise.all([
        dashboardService.getKpis(),
        dashboardService.getUpcomingEvents(),
      ]);
      setKpis(kpisData);
      setUpcomingEvents(eventsData);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Admin 📊
          </h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble de votre activité
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Réservations du jour */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Réservations du jour</p>
              <span className="text-3xl">📅</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {kpis?.todayBookings || 0}
            </p>
          </div>

          {/* Revenus du mois */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Revenus du mois</p>
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis?.monthRevenue || 0)}
            </p>
          </div>

          {/* Avis en attente */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Avis en attente</p>
              <span className="text-3xl">⭐</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {kpis?.pendingReviews || 0}
            </p>
          </div>

          {/* Photos uploadées */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Photos ce mois</p>
              <span className="text-3xl">📸</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {kpis?.monthPhotos || 0}
            </p>
          </div>

          {/* Nouveaux clients */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Nouveaux clients</p>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-indigo-600">
              {kpis?.newClients || 0}
            </p>
          </div>

          {/* Taux de confirmation */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Taux de confirmation</p>
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-3xl font-bold text-teal-600">
              {kpis?.confirmationRate || 0}%
            </p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            to="/admin/bookings"
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📅</div>
            <p className="font-bold">Réservations</p>
          </Link>

          <Link
            to="/admin/reviews"
            className="bg-yellow-600 text-white p-4 rounded-lg hover:bg-yellow-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">⭐</div>
            <p className="font-bold">Modérer avis</p>
          </Link>

          <Link
            to="/admin/services"
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📸</div>
            <p className="font-bold">Services</p>
          </Link>

          <Link
            to="/admin/employees"
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <p className="font-bold">Employés</p>
          </Link>
        </div>

        {/* Prochains événements */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Prochaines séances (7 jours)</h2>

          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucune séance prévue dans les 7 prochains jours
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold">{event.title}</p>
                      <p className="text-sm text-gray-600">
                        Client : {event.client}
                      </p>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(event.date).toLocaleDateString('fr-FR')} à{' '}
                        {event.time}
                      </p>
                      {event.employee && (
                        <p className="text-sm text-gray-600">
                          👤 Photographe : {event.employee}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        event.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {event.status === 'confirmed' ? 'Confirmée' : 'En attente'}
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

export default AdminDashboard;
