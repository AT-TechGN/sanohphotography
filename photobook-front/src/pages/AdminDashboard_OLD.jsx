import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import Loading from '../components/common/Loading';
import {
  CalendarDaysIcon,
  BanknotesIcon,
  StarIcon,
  PhotoIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpisData, chartsData, activityData, eventsData] = await Promise.all([
        dashboardService.getKpis(),
        dashboardService.getCharts(timeRange),
        dashboardService.getActivityFeed(10),
        dashboardService.getUpcomingEvents(),
      ]);
      setKpis(kpisData);
      setCharts(chartsData);
      setActivities(activityData);
      setUpcomingEvents(eventsData);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#9333ea', '#ec4899', '#f97316', '#06b6d4', '#10b981', '#f59e0b'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking':
        return <CalendarDaysIcon className="w-5 h-5 text-purple-600" />;
      case 'review':
        return <StarIcon className="w-5 h-5 text-yellow-600" />;
      case 'invoice':
        return <BanknotesIcon className="w-5 h-5 text-green-600" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tableau de Bord
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
        
        {/* Time range selector */}
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === days
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {days} jours
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Réservations du jour */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">{kpis?.todayBookings || 0}</div>
          <div className="text-sm text-purple-100">Réservations aujourd'hui</div>
        </div>

        {/* Revenus du mois */}
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(kpis?.monthRevenue || 0)}
          </div>
          <div className="text-sm text-pink-100">Revenus ce mois</div>
        </div>

        {/* Avis en attente */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <StarIcon className="w-6 h-6" />
            </div>
            <ClockIcon className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">{kpis?.pendingReviews || 0}</div>
          <div className="text-sm text-orange-100">Avis en attente</div>
        </div>

        {/* Photos du mois */}
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <PhotoIcon className="w-6 h-6" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">{kpis?.monthPhotos || 0}</div>
          <div className="text-sm text-cyan-100">Photos ce mois</div>
        </div>

        {/* Nouveaux clients */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">{kpis?.newClients || 0}</div>
          <div className="text-sm text-green-100">Nouveaux clients</div>
        </div>

        {/* Taux de confirmation */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">{kpis?.confirmationRate || 0}%</div>
          <div className="text-sm text-amber-100">Taux de confirmation</div>
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
