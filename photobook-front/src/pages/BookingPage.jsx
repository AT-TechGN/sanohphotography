import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useBookingStore from '../stores/bookingStore';
import useAuthStore from '../stores/authStore';
import BookingStep1 from '../components/booking/BookingStep1';
import BookingStep2 from '../components/booking/BookingStep2';
import BookingStep3 from '../components/booking/BookingStep3';
import BookingStep4 from '../components/booking/BookingStep4';
import BookingStep5 from '../components/booking/BookingStep5';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { currentStep, selectService, reset } = useBookingStore();

  useEffect(() => {
    // Si un service est passé en state, le sélectionner
    if (location.state?.selectedService) {
      selectService(location.state.selectedService);
    }

    // Réinitialiser à la sortie
    return () => {
      // Optionnel: reset();
    };
  }, [location.state]);

  // Rediriger vers login si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { from: '/booking', message: 'Veuillez vous connecter pour réserver' } 
      });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const steps = [
    { number: 1, title: 'Service', component: BookingStep1 },
    { number: 2, title: 'Date', component: BookingStep2 },
    { number: 3, title: 'Créneau', component: BookingStep3 },
    { number: 4, title: 'Informations', component: BookingStep4 },
    { number: 5, title: 'Confirmation', component: BookingStep5 },
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Réserver une séance photo
          </h1>
          <p className="text-lg text-gray-600">
            Suivez les étapes pour finaliser votre réservation
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  {/* Numéro de l'étape */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                      step.number === currentStep
                        ? 'bg-blue-600 text-white'
                        : step.number < currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step.number < currentStep ? '✓' : step.number}
                  </div>

                  {/* Titre de l'étape */}
                  <p
                    className={`mt-2 text-sm font-medium ${
                      step.number === currentStep
                        ? 'text-blue-600'
                        : step.number < currentStep
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>

                {/* Ligne de séparation */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-4 -mt-8">
                    <div
                      className={`h-full ${
                        step.number < currentStep
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Composant de l'étape actuelle */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <CurrentStepComponent />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
