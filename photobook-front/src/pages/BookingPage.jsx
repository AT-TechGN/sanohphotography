/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import useBookingStore from '../stores/bookingStore';
import useAuthStore from '../stores/authStore';
import BookingStep1 from '../components/booking/BookingStep1';
import BookingStep2 from '../components/booking/BookingStep2';
import BookingStep3 from '../components/booking/BookingStep3';
import BookingStep4 from '../components/booking/BookingStep4';
import BookingStep5 from '../components/booking/BookingStep5';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { currentStep, selectService } = useBookingStore();
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pt-14 sm:pt-16">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-gray-900 via-amber-950 to-gray-900 text-white py-12">
        <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Réserver une séance photo
              </h1>
              <p className="text-lg text-gray-300">
                Suivez les étapes pour finaliser votre réservation
              </p>
            </Motion.div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-8">
        {/* Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  {/* Numéro de l'étape */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      step.number === currentStep
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                        : step.number < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      step.number
                    )}
                  </div>

                  {/* Titre de l'étape */}
                  <p
                    className={`mt-2 text-xs sm:text-sm font-medium ${
                      step.number === currentStep
                        ? 'text-amber-600 dark:text-amber-400'
                        : step.number < currentStep
                        ? 'text-green-600'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>

                {/* Ligne de séparation */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-2 -mt-6">
                    <div
                      className={`h-full rounded-full ${
                        step.number < currentStep
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Composant de l'étape actuelle */}
        <Motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8"
        >
          <CurrentStepComponent />
        </Motion.div>
      </div>
    </div>
  );
};

export default BookingPage;

