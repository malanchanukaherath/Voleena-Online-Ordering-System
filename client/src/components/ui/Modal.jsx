import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

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

  // Render into document.body via portal so the modal is never trapped inside
  // a parent stacking context created by backdrop-filter (sticky header, etc.)
  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[3px] animate-modal-backdrop-in motion-reduce:animate-none"
        onClick={onClose}
      />
      
      {/* Modal panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full min-w-0 ${sizeClasses[size]} ${className}`}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-label={title ? undefined : 'Dialog'}
            className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto animate-modal-panel-in motion-reduce:animate-none dark:bg-slate-800 dark:border-slate-700"
            style={{ boxShadow: '0 25px 60px -15px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 dark:bg-slate-800 dark:border-slate-700">
                <h3 id={titleId} className="text-base font-semibold text-gray-900 leading-tight dark:text-slate-100">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-700 dark:active:bg-slate-600"
                  aria-label="Close dialog"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
