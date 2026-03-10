import { useEffect } from 'react';
import useUIStore from '../../stores/uiStore';

const Notification = () => {
  const { notifications, removeNotification } = useUIStore();

  useEffect(() => {
    // Supprimer automatiquement les notifications après leur durée
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);

      return () => clearTimeout(timer);
    });
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-500 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getColors(
            notification.type
          )} border-l-4 p-4 rounded-lg shadow-lg animate-slide-in-right`}
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
