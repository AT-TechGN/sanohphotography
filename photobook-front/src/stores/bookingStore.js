import { create } from 'zustand';

/**
 * Store pour le processus de réservation (5 étapes)
 */
const useBookingStore = create((set, get) => ({
  // Données du tunnel de réservation
  currentStep: 1,
  selectedService: null,
  selectedDate: null,
  selectedSlot: null,
  clientInfo: {
    participants: 1,
    notes: '',
  },
  
  // État
  loading: false,
  error: null,
  availableSlots: [],

  /**
   * Passer à l'étape suivante
   */
  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 5) {
      set({ currentStep: currentStep + 1 });
    }
  },

  /**
   * Revenir à l'étape précédente
   */
  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  /**
   * Aller à une étape spécifique
   */
  goToStep: (step) => {
    if (step >= 1 && step <= 5) {
      set({ currentStep: step });
    }
  },

  /**
   * Sélectionner un service
   */
  selectService: (service) => {
    set({ 
      selectedService: service,
      selectedDate: null,
      selectedSlot: null,
      availableSlots: [],
    });
  },

  /**
   * Sélectionner une date
   */
  selectDate: (date) => {
    set({ 
      selectedDate: date,
      selectedSlot: null,
    });
  },

  /**
   * Sélectionner un créneau
   */
  selectSlot: (slot) => {
    set({ selectedSlot: slot });
  },

  /**
   * Mettre à jour les informations client
   */
  updateClientInfo: (info) => {
    set({ 
      clientInfo: { 
        ...get().clientInfo, 
        ...info 
      } 
    });
  },

  /**
   * Définir les créneaux disponibles
   */
  setAvailableSlots: (slots) => {
    set({ availableSlots: slots });
  },

  /**
   * Obtenir les données de réservation complètes
   */
  getBookingData: () => {
    const { selectedService, selectedDate, selectedSlot, clientInfo } = get();
    
    return {
      service_id: selectedService?.id,
      scheduled_date: selectedDate,
      scheduled_time: selectedSlot?.startTime,
      participants: clientInfo.participants,
      notes: clientInfo.notes,
      total_price: selectedService?.basePrice,
    };
  },

  /**
   * Réinitialiser le processus de réservation
   */
  reset: () => {
    set({
      currentStep: 1,
      selectedService: null,
      selectedDate: null,
      selectedSlot: null,
      clientInfo: {
        participants: 1,
        notes: '',
      },
      availableSlots: [],
      error: null,
    });
  },

  /**
   * Définir une erreur
   */
  setError: (error) => set({ error }),

  /**
   * Définir le chargement
   */
  setLoading: (loading) => set({ loading }),
}));

export default useBookingStore;
