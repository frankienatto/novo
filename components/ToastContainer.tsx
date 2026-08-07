import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import { eventBus } from '../services/apiService';
import { AppNotification } from '../types';

const ToastContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const handleNewToast = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: AppNotification = {
            id: `toast-${Date.now()}`,
            timestamp: new Date().toISOString(),
            read: true, // Toasts are considered "read" upon display
            ...notification,
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    eventBus.on('new-toast', handleNewToast);

    return () => {
      eventBus.off('new-toast', handleNewToast);
    };
  }, []);

  const dismissToast = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {notifications.map(notification => (
          <Toast
            key={notification.id}
            notification={notification}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
