import { useEffect, useRef } from 'react';
import useUIStore from '../../stores/uiStore';

const Notification = () => {
  const { notifications, removeNotification } = useUIStore();
  // BUG CORRIGÉ : le useEffect original utilisait forEach avec return () => clearTimeout()
  // mais le return dans un forEach ne fait rien — seul le dernier timer était "nettoyé",
  // et encore seulement sur le cleanup du render précédent.
  // Solution : stocker tous les timers dans une ref et les nettoyer tous ensemble.
  const timersRef = useRef({});

  useEffect(() => {
    notifications.forEach((notification) => {
      // Ne pas recréer un timer qui existe déjà
      if (timersRef.current[notification.id]) return;

      timersRef.current[notification.id] = setTimeout(() => {
        removeNotification(notification.id);
        delete timersRef.current[notification.id];
      }, notification.duration);
    });

    // Cleanup : annuler les timers des notifications qui ont disparu
    return () => {
      const currentIds = new Set(notifications.map((n) => n.id));
      Object.keys(timersRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          clearTimeout(timersRef.current[id]);
          delete timersRef.current[id];
        }
      });
    };
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'error':   return '✕';
      case 'warning': return '⚠';
      default:        return 'ℹ';
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-500 text-green-800';
      case 'error':   return 'bg-red-50 border-red-500 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      default:        return 'bg-blue-50 border-blue-500 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getColors(notification.type)} border-l-4 p-4 rounded-lg shadow-lg animate-slide-in-right`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">{getIcon(notification.type)}</span>
            </div>
            <div className="ml-3 flex-1">
              {notification.title && (
                <h3 className="text-sm font-medium">{notification.title}</h3>
              )}
              <div className="text-sm mt-1">{notification.message}</div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notification;
