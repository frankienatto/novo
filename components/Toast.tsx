import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { AppNotification } from '../types';

interface ToastProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
  const [exiting, setExiting] = useState(false);
  const { id, type, title, message } = notification;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };

  const icons = {
    success: <CheckCircle className="text-green-500" />,
    error: <AlertTriangle className="text-red-500" />,
    info: <Info className="text-blue-500" />,
    default: <Info className="text-gray-500" />,
  };

  const toastType = ['success', 'error', 'info'].includes(type) ? type as 'success' | 'error' | 'info' : 'default';

  return (
    <div
      className={`
        w-full max-w-sm bg-white shadow-2xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
        transition-all duration-300 ease-in-out
        ${exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[toastType]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
       <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-brand-green to-emerald-400 animate-toast-progress"
          style={{ animationDuration: '5s' }}
          ></div>
      </div>
       <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-progress {
          animation: toast-progress linear forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;
