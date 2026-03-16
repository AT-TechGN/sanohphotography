import { create } from 'zustand';
import contactService from '../services/contactService';
import useAuthStore from './authStore';

/* ── Store notifications admin (polling toutes les 30s) ─────────────────── */
const useNotificationStore = create((set, get) => ({
  unreadMessages:  0,
  pendingBookings: 0,
  total:           0,
  lastChecked:     null,
  pollingActive:   false,
  intervalId:      null,

  // Charger les compteurs
  fetchCounts: async () => {
    const { user } = useAuthStore.getState();
    const isStaff = user?.roles?.some(r =>
      ['ROLE_ADMIN', 'ROLE_PHOTOGRAPHE', 'ROLE_EMPLOYE', 'ROLE_EMPLOYEE'].includes(r)
    );
    if (!isStaff) return;

    try {
      const data = await contactService.getUnreadCount();
      const prev = get().total;
      set({
        unreadMessages:  data.unreadMessages  ?? 0,
        pendingBookings: data.pendingBookings ?? 0,
        total:           data.total           ?? 0,
        lastChecked:     new Date(),
      });
      // Retourner si nouvelles notifs pour déclencher alerte dans le composant
      return { newCount: (data.total ?? 0) - prev, data };
    } catch {
      // Silencieux si pas connecté ou serveur off
    }
  },

  // Démarrer le polling
  startPolling: (intervalMs = 30000) => {
    const { intervalId, fetchCounts } = get();
    if (intervalId) return; // déjà actif

    fetchCounts(); // fetch immédiat

    const id = setInterval(() => {
      const { user } = useAuthStore.getState();
      const isStaff = user?.roles?.some(r =>
        ['ROLE_ADMIN', 'ROLE_PHOTOGRAPHE', 'ROLE_EMPLOYE', 'ROLE_EMPLOYEE'].includes(r)
      );
      if (isStaff) fetchCounts();
    }, intervalMs);

    set({ intervalId: id, pollingActive: true });
  },

  // Arrêter le polling
  stopPolling: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
      set({ intervalId: null, pollingActive: false });
    }
  },

  // Décrémenter après lecture
  decrementMessages: (n = 1) =>
    set(state => ({
      unreadMessages: Math.max(0, state.unreadMessages - n),
      total:          Math.max(0, state.total - n),
    })),
}));

export default useNotificationStore;
