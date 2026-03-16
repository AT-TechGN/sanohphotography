import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import useAuthStore from '../stores/authStore';
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
  CameraIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const hasAdminRole = user?.roles?.some(role =>
      role === 'ROLE_ADMIN' || role === 'ROLE_PHOTOGRAPHE' || role === 'ROLE_EMPLOYEE'
    );

    if (!hasAdminRole) {
      setError('Vous n\'avez pas accès à cette section. Veuillez contacter l\'administrateur.');
      setLoading(false);
      return;
    }

    loadData();
  }, [timeRange, user, loadData]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [kpisData, chartsData, activityData, eventsData] = await Promise.all([
        dashboardService.getKpis(),
        dashboardService.getCharts(timeRange),
        dashboardService.getActivityFeed(10),
        dashboardService.getUpcomingEvents(),
      ]);

      setKpis(kpisData);
      setCharts(chartsData);
      setActivities(activityData || []);
      setUpcomingEvents(eventsData || []);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);

      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }, 2000);
      } else if (err.response?.status === 403) {
        setError('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      } else {
        setError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
      }
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
        return <CalendarDaysIcon className="w-5 h-5 text-amber-600" />;
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

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Erreur</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de Bord</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === days
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {days} jours
            </button>
          ))}
        </div>
      </div> {/* CORRECTION 2 : </div> fermant du flex header manquant */}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

        {/* CORRECTION 3 : </div> fermants manquants pour chaque card KPI */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">{kpis?.todayBookings || 0}</div>
          <div className="text-sm text-amber-100">Réservations aujourd'hui</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">{formatCurrency(kpis?.monthRevenue || 0)}</div>
          <div className="text-sm text-orange-100">Revenus ce mois</div>
        </div>

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

      </div> {/* CORRECTION 4 : </div> fermant de la grille KPI manquant */}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Évolution des Réservations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts?.bookings || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} />
              <Line type="monotone" dataKey="count" stroke="#9333ea" strokeWidth={2} dot={{ fill: '#9333ea', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Évolution des Revenus (GNF)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts?.revenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} formatter={(value) => formatCurrency(value)} />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
              </defs>
              <Bar dataKey="amount" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div> {/* CORRECTION 5 : </div> fermant de la grille charts row 1 manquant */}

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Répartition par Service</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts?.serviceDistribution || []}
                dataKey="count"
                nameKey="service"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.service} (${entry.count})`}
              >
                {(charts?.serviceDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Satisfaction Client (Avis)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts?.reviewsDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="rating" stroke="#6b7280" label={{ value: 'Note (étoiles)', position: 'insideBottom', offset: -5 }} />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div> {/* CORRECTION 6 : </div> fermant de la grille charts row 2 manquant */}

      {/* Activity & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Activité Récente</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{activity.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(activity.timestamp).toLocaleString('fr-FR')}</p>
                </div>
              </div> {/* CORRECTION 7 : </div> fermant de chaque item activité manquant */}
            ))}
          </div>
        </div> {/* CORRECTION 8 : </div> fermant du panel activité manquant */}

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Prochaines Séances (7 jours)</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <Link key={event.id} to="/admin/bookings" className="block p-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${event.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                      {event.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>👤 {event.client}</p>
                    <p>📅 {new Date(event.date).toLocaleDateString('fr-FR')} à {event.time}</p>
                    {event.employee && <p>📷 {event.employee}</p>}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucune séance prévue dans les 7 prochains jours</p>
            )}
          </div>
        </div> {/* CORRECTION 9 : </div> fermant du panel événements manquant */}
      </div> {/* CORRECTION 10 : </div> fermant de la grille activité/événements manquant */}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/admin/bookings" className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all text-center">
          <CalendarDaysIcon className="w-8 h-8 mx-auto mb-2" />
          <div className="font-semibold">Gérer Réservations</div>
        </Link>

        <Link to="/admin/photos" className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all text-center">
          <PhotoIcon className="w-8 h-8 mx-auto mb-2" />
          <div className="font-semibold">Gérer Photos</div>
        </Link>

        <Link to="/admin/reviews" className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all text-center">
          <StarIcon className="w-8 h-8 mx-auto mb-2" />
          <div className="font-semibold">Modérer Avis</div>
        </Link>

        <Link to="/admin/services" className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all text-center">
          <CameraIcon className="w-8 h-8 mx-auto mb-2" />
          <div className="font-semibold">Gérer Services</div>
        </Link>
      </div>

    </div>
  );
};

export default AdminDashboard;
