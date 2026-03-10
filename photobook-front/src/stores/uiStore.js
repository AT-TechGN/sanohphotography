import { create } from 'zustand';

/**
 * Store pour l'état de l'interface utilisateur
 */
const useUIStore = create((set) => ({
  // Sidebar admin
  sidebarOpen: true,
  
  // Modales
  modals: {
    login: false,
    register: false,
    bookingConfirm: false,
    serviceForm: false,
    employeeForm: false,
    reviewSubmit: false,
  },

  // Notifications
  notifications: [],

  // Lightbox galerie
  lightbox: {
    isOpen: false,
    currentIndex: 0,
    images: [],
  },

  /**
   * Basculer la sidebar
   */
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  /**
   * Ouvrir/Fermer une modale
   */
  openModal: (modalName) => 
    set((state) => ({
      modals: { ...state.modals, [modalName]: true }
    })),

  closeModal: (modalName) => 
    set((state) => ({
      modals: { ...state.modals, [modalName]: false }
    })),

  /**
   * Ajouter une notification
   */
  addNotification: (notification) => 
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: Date.now(),
          type: 'info', // success, error, warning, info
          duration: 5000,
          ...notification,
        }
      ]
    })),

  /**
   * Supprimer une notification
   */
  removeNotification: (id) => 
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),

  /**
   * Ouvrir la lightbox
   */
  openLightbox: (images, currentIndex = 0) => 
    set({
      lightbox: {
        isOpen: true,
        images,
        currentIndex,
      }
    }),

  /**
   * Fermer la lightbox
   */
  closeLightbox: () => 
    set({
      lightbox: {
        isOpen: false,
        images: [],
        currentIndex: 0,
      }
    }),

  /**
   * Naviguer dans la lightbox
   */
  setLightboxIndex: (index) => 
    set((state) => ({
      lightbox: {
        ...state.lightbox,
        currentIndex: index,
      }
    })),

  /**
   * Afficher une notification de succès
   */
  showSuccess: (message) => 
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: Date.now(),
          type: 'success',
          message,
          duration: 5000,
        }
      ]
    })),

  /**
   * Afficher une notification d'erreur
   */
  showError: (message) => 
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: Date.now(),
          type: 'error',
          message,
          duration: 7000,
        }
      ]
    })),
}));

export default useUIStore;
