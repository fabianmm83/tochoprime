import React, { ReactNode, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'w-full h-full max-w-none max-h-none rounded-none'
  };

  const containerClasses = size === 'full' 
    ? 'flex min-h-screen items-start justify-center p-0'
    : 'flex min-h-screen items-center justify-center p-4';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className={containerClasses}>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`relative ${sizeClasses[size]} bg-white rounded-xl shadow-xl ${size === 'full' ? 'h-screen' : ''}`}>
          {/* Header - sticky para modales full */}
          <div className={`flex items-center justify-between border-b border-gray-200 ${
            size === 'full' 
              ? 'sticky top-0 bg-white z-10 p-4' 
              : 'p-6'
          }`}>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className={`${
            size === 'full' 
              ? 'p-4 h-[calc(100vh-4rem)] overflow-y-auto' 
              : 'p-6 max-h-[70vh] overflow-y-auto'
          }`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;