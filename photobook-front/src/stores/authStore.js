import { create } from 'zustand';
import authService from '../services/authService';

/**
 * Store Zustand pour la gestion de l'authentification
 */
const useAuthStore = create((set, get) => ({
  user: authService.getUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,
  error: null,

  /**
   * Connexion
   */
  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authService.login(credentials);
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        loading: false 
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur de connexion';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Inscription
   */
  register: async (data) => {
    set({ loading: true, error: null });
    try {
      await authService.register(data);
      set({ loading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'inscription';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Déconnexion
   */
  logout: () => {
    authService.logout();
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false 
    });
  },

  /**
   * Vérifier si l'utilisateur a un rôle
   */
  hasRole: (role) => {
    const { user } = get();
    return user?.roles?.includes(role) || false;
  },

  /**
   * Rafraîchir les données utilisateur
   */
  refreshUser: async () => {
    try {
      const user = await authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      // Token invalide, déconnecter
      get().logout();
    }
  },

  /**
   * Réinitialiser l'erreur
   */
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
