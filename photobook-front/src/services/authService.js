import api from './api';

/**
 * Service d'authentification
 */
const authService = {
  /**
   * Inscription d'un nouveau client
   */
  async register(data) {
    const response = await api.post('/register', data);
    return response.data;
  },

  /**
   * Connexion
   */
  async login(credentials) {
    const response = await api.post('/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Récupérer les infos utilisateur
      const user = await this.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      return { token: response.data.token, user };
    }
    return response.data;
  },

  /**
   * Déconnexion
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Récupérer l'utilisateur connecté
   */
  async getCurrentUser() {
    const response = await api.get('/me');
    return response.data;
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Récupérer l'utilisateur depuis le localStorage
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role) {
    const user = this.getUser();
    return user?.roles?.includes(role) || false;
  },
};

export default authService;
