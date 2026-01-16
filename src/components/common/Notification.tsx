import React, { useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ 
  type, 
  message, 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
    error: <ExclamationCircleIcon className="w-5 h-5 text-red-600" />,
    warning: <ExclamationCircleIcon className="w-5 h-5 text-yellow-600" />,
    info: <ExclamationCircleIcon className="w-5 h-5 text-blue-600" />
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center p-4 rounded-lg border ${typeClasses[type]} shadow-lg max-w-md`}>
        <div className="mr-3">
          {icons[type]}
        </div>
        <div className="flex-1 mr-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-opacity-20 hover:bg-gray-900 rounded"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Notification;