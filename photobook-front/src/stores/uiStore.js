import { create } from 'zustand';

/**
 * Générateur d'ID unique pour les notifications.
 * CORRECTION 6 : Date.now() seul n'est pas unique si deux notifications
 * sont créées dans la même milliseconde (ex: Promise.all qui échoue sur
 * plusieurs requêtes simultanées) → les IDs étaient identiques et Zustand
 * écrasait silencieusement la première notification.
 * Solution : compteur auto-incrémenté combiné à Date.now().
 */
let _notifCounter = 0;
const uniqueId = () => `${Date.now()}-${++_notifCounter}`;

const useUIStore = create((set) => ({
  // ── Sidebar admin ─────────────────────────────────────────────────────────
  sidebarOpen: true,

  // ── Modales ───────────────────────────────────────────────────────────────
  modals: {
    login:          false,
    register:       false,
    bookingConfirm: false,
    serviceForm:    false,
    employeeForm:   false,
    reviewSubmit:   false,
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: [],

  // ── Lightbox galerie ──────────────────────────────────────────────────────
  lightbox: {
    isOpen:       false,
    currentIndex: 0,
    images:       [],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Sidebar
  // ─────────────────────────────────────────────────────────────────────────
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // ─────────────────────────────────────────────────────────────────────────
  // Modales
  // ─────────────────────────────────────────────────────────────────────────
  openModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
    })),

  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
    })),

  // ─────────────────────────────────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────────────────────────────────
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id:       uniqueId(), // CORRECTION 6 appliquée ici aussi
          type:     'info',
          duration: 5000,
          ...notification,
        },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  /**
   * CORRECTION 7 : clearAllNotifications manquait.
   * Utile au logout, changement de page, ou après une action globale
   * pour éviter des notifications orphelines qui restent affichées.
   */
  clearAllNotifications: () => set({ notifications: [] }),

  // ─────────────────────────────────────────────────────────────────────────
  // Lightbox
  // ─────────────────────────────────────────────────────────────────────────
  openLightbox: (images, currentIndex = 0) =>
    set({
      lightbox: { isOpen: true, images, currentIndex },
    }),

  closeLightbox: () =>
    set({
      lightbox: { isOpen: false, images: [], currentIndex: 0 },
    }),

  setLightboxIndex: (index) =>
    set((state) => ({
      lightbox: { ...state.lightbox, currentIndex: index },
    })),

  // ─────────────────────────────────────────────────────────────────────────
  // Raccourcis notifications typées
  // ─────────────────────────────────────────────────────────────────────────
  showSuccess: (message) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: uniqueId(), type: 'success', message, duration: 5000 },
      ],
    })),

  showError: (message) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: uniqueId(), type: 'error', message, duration: 7000 },
      ],
    })),

  /**
   * CORRECTION 7 bis : ajout de showWarning et showInfo pour compléter
   * la palette (le store définissait 4 types mais seulement 2 helpers).
   */
  showWarning: (message) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: uniqueId(), type: 'warning', message, duration: 6000 },
      ],
    })),

  showInfo: (message) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: uniqueId(), type: 'info', message, duration: 5000 },
      ],
    })),
}));

export default useUIStore;
