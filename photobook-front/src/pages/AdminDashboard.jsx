import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import dashboardService from '../services/dashboardService';
import useAuthStore from '../stores/authStore';
import {
  CalendarDaysIcon, BanknotesIcon, StarIcon, PhotoIcon,
  UsersIcon, ArrowTrendingUpIcon, ClockIcon, CheckCircleIcon,
  CameraIcon, ExclamationTriangleIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/* ─── Palette cohérente amber/orange ────────────────────────────────────── */
const COLORS = ['#f59e0b', '#f97316', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899'];

const fmtCurrency = (v) =>
  new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(v ?? 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

/* ─── Skeleton card ─────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
    <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
    <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
);

/* ─── KPI Card animée ───────────────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, value, label, gradient, delay = 0, suffix = '' }) => (
  <Motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    whileHover={{ scale: 1.03, y: -2 }}
    whileTap={{ scale: 0.97 }}
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg cursor-default select-none`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
        <Icon className="w-5 h-5" />
      </div>
      <ArrowTrendingUpIcon className="w-4 h-4 opacity-60" />
    </div>
    <div className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight">
      {value}{suffix}
    </div>
    <div className="text-xs font-medium opacity-80 leading-tight">{label}</div>
  </Motion.div>
);

/* ─── Chart card ────────────────────────────────────────────────────────── */
const ChartCard = ({ title, children, delay = 0 }) => (
  <Motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
  >
    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
      {title}
    </h3>
    {children}
  </Motion.div>
);

/* ─── Badge statut ──────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  const labels = { confirmed: 'Confirmé', pending: 'En attente', completed: 'Terminé' };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${map[status] ?? map.pending}`}>
      {labels[status] ?? status}
    </span>
  );
};

/* ─── Composant principal ───────────────────────────────────────────────── */
const AdminDashboard = () => {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();

  const [kpis,           setKpis]           = useState(null);
  const [charts,         setCharts]         = useState(null);
  const [activities,     setActivities]     = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState(null);
  const [timeRange,      setTimeRange]      = useState(30);
  const [lastUpdated,    setLastUpdated]    = useState(null);

  const intervalRef = useRef(null);

  const loadData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else        setLoading(true);
    setError(null);

    try {
      const [kpisData, chartsData, activityData, eventsData] = await Promise.all([
        dashboardService.getKpis(),
        dashboardService.getCharts(timeRange),
        dashboardService.getActivityFeed(10),
        dashboardService.getUpcomingEvents(),
      ]);
      setKpis(kpisData);
      setCharts(chartsData);
      setActivities(activityData ?? []);
      setUpcomingEvents(eventsData ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expirée.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (!silent) {
        setError('Erreur chargement. Réessayez.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, navigate]);

  /* Premier chargement + re-chargement quand timeRange change */
  useEffect(() => {
    const isStaff = user?.roles?.some(r =>
      ['ROLE_ADMIN', 'ROLE_PHOTOGRAPHE', 'ROLE_EMPLOYEE'].includes(r)
    );
    if (!isStaff) {
      setError('Accès refusé.');
      setLoading(false);
      return;
    }
    loadData(false);
  }, [timeRange, user, loadData]);

  /* Auto-refresh toutes les 30 secondes (silencieux) */
  useEffect(() => {
    intervalRef.current = setInterval(() => loadData(true), 30_000);
    return () => clearInterval(intervalRef.current);
  }, [loadData]);

  /* ── Skeleton ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="w-48 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mb-2" />
            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => loadData(false)}
            className="px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-400 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const kpiCards = [
    { icon: CalendarDaysIcon, value: kpis?.todayBookings   ?? 0,   label: "Séances aujourd'hui",   gradient: 'from-amber-500 to-amber-600'   },
    { icon: BanknotesIcon,    value: fmtCurrency(kpis?.monthRevenue), label: 'Revenus ce mois',     gradient: 'from-orange-500 to-orange-600' },
    { icon: ClockIcon,        value: kpis?.pendingReviews  ?? 0,   label: 'Avis en attente',        gradient: 'from-yellow-500 to-yellow-600' },
    { icon: PhotoIcon,        value: kpis?.monthPhotos     ?? 0,   label: 'Photos ce mois',         gradient: 'from-cyan-500 to-cyan-600'     },
    { icon: UsersIcon,        value: kpis?.newClients      ?? 0,   label: 'Nouveaux clients',       gradient: 'from-green-500 to-green-600'   },
    { icon: CheckCircleIcon,  value: kpis?.confirmationRate ?? 0,  label: 'Taux confirmation',      gradient: 'from-amber-600 to-orange-600', suffix: '%' },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-5 pb-24 lg:pb-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5">
            {refreshing && <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />}
            {lastUpdated
              ? `Mis à jour à ${lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Chargement…'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton refresh manuel */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-400 transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <ArrowPathIcon className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Filtres période */}
          <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setTimeRange(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeRange === d
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {d}j
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Cards — grille responsive ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((card, i) => (
          <KpiCard key={card.label} {...card} delay={i * 0.06} />
        ))}
      </div>

      {/* ── Charts ligne 1 ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Évolution des réservations" delay={0.3}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts?.bookings ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#9ca3af" tick={{ fontSize: 10 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.75rem', color: '#f3f4f6', fontSize: 12 }}
                labelFormatter={fmtDate}
              />
              <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2.5}
                dot={{ fill: '#f59e0b', r: 3 }} activeDot={{ r: 5, fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenus (GNF)" delay={0.35}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts?.revenue ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#9ca3af" tick={{ fontSize: 10 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.75rem', color: '#f3f4f6', fontSize: 12 }}
                formatter={(v) => [fmtCurrency(v), 'Revenus']}
                labelFormatter={fmtDate}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {(charts?.revenue ?? []).map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? '#f59e0b' : '#f97316'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Charts ligne 2 ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Répartition par service" delay={0.4}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={charts?.serviceDistribution ?? []} dataKey="count" nameKey="service"
                cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                label={({ service, percent }) => percent > 0.05 ? `${service} ${(percent * 100).toFixed(0)}%` : ''}
                labelLine={false}
              >
                {(charts?.serviceDistribution ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.75rem', color: '#f3f4f6', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Satisfaction client" delay={0.45}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts?.reviewsDistribution ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="rating" stroke="#9ca3af" tick={{ fontSize: 10 }}
                label={{ value: '★ Étoiles', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#9ca3af' }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.75rem', color: '#f3f4f6', fontSize: 12 }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Activité + Prochaines séances ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Activité récente */}
        <Motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
            Activité récente
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-none">
            <AnimatePresence>
              {activities.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Aucune activité récente</p>
              ) : activities.map((a, i) => (
                <Motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    a.type === 'booking' ? 'bg-amber-100 dark:bg-amber-900/30' :
                    a.type === 'review'  ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {a.type === 'booking'
                      ? <CalendarDaysIcon className="w-4 h-4 text-amber-600" />
                      : a.type === 'review'
                      ? <StarIcon className="w-4 h-4 text-yellow-600" />
                      : <BanknotesIcon className="w-4 h-4 text-green-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug">{a.message}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(a.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </Motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Motion.div>

        {/* Prochaines séances */}
        <Motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
            Prochaines séances (7 jours)
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-none">
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Aucune séance prévue</p>
            ) : upcomingEvents.map((ev, i) => (
              <Motion.div key={ev.id}
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to="/admin/bookings"
                  className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-600 leading-none">
                      {new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit' })}
                    </span>
                    <span className="text-[9px] text-amber-500 uppercase">
                      {new Date(ev.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ev.title}</p>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      👤 {ev.client} · 🕐 {ev.time}
                      {ev.employee ? ` · 📷 ${ev.employee}` : ''}
                    </p>
                  </div>
                </Link>
              </Motion.div>
            ))}
          </div>
        </Motion.div>
      </div>

      {/* ── Actions rapides ───────────────────────────────────────── */}
      <Motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Actions rapides
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/admin/bookings', icon: CalendarDaysIcon, label: 'Réservations', gradient: 'from-amber-500 to-amber-600' },
            { to: '/admin/photos',   icon: PhotoIcon,        label: 'Photos',       gradient: 'from-orange-500 to-orange-600' },
            { to: '/admin/reviews',  icon: StarIcon,         label: 'Avis',         gradient: 'from-yellow-500 to-yellow-600' },
            { to: '/admin/services', icon: CameraIcon,       label: 'Services',     gradient: 'from-cyan-500 to-cyan-600' },
          ].map(({ to, icon: Icon, label, gradient }, i) => (
            <Motion.div
              key={to}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.07 }}
            >
              <Link to={to}
                className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${gradient} text-white rounded-2xl p-5 hover:shadow-lg transition-shadow`}
              >
                <Icon className="w-7 h-7" />
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            </Motion.div>
          ))}
        </div>
      </Motion.div>

    </div>
  );
};

export default AdminDashboard;
