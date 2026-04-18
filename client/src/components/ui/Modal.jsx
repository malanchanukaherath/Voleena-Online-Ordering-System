import React, { useEffect } from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '' 
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full'
  };
  const titleId = title ? 'modal-title' : undefined;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] animate-modal-backdrop-in motion-reduce:animate-none"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full min-w-0 ${sizeClasses[size]} ${className}`}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-label={title ? undefined : 'Dialog'}
            className="bg-white rounded-2xl border border-gray-200/90 shadow-2xl max-h-[90vh] overflow-y-auto animate-modal-panel-in motion-reduce:animate-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-white/95 backdrop-blur border-b border-gray-200">
                <h3 id={titleId} className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label="Close dialog"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Content */}
            <div className="p-5 md:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
