/**
 * Composant Loading — spinner réutilisable
 *
 * CORRECTION 8 : couleur du spinner changée de "border-blue-600" (bleu)
 *   en "border-purple-600" pour être cohérent avec le thème violet du projet.
 *
 * CORRECTION 9 : ajout de la prop `text` pour afficher un message optionnel
 *   sous le spinner (ex: <Loading text="Chargement des photos..." />).
 *   Utile pour les opérations longues (upload, fetch initial) afin de donner
 *   un retour visuel explicite à l'utilisateur.
 */
const Loading = ({ size = 'md', fullScreen = false, text = '' }) => {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} border-purple-600 border-t-transparent rounded-full animate-spin`}
      />
      {/* CORRECTION 9 : message optionnel sous le spinner */}
      {text && (
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loading;