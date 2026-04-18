import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl border border-transparent shadow-sm transition-all duration-150 ease-out motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed motion-press active:scale-[0.98] disabled:active:scale-100 disabled:shadow-none select-none';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500 shadow-sm hover:shadow dark:focus:ring-offset-slate-900',
    secondary: 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 focus:ring-gray-400 shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:focus:ring-offset-slate-900',
    outline: 'bg-transparent border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 active:bg-primary-100 focus:ring-primary-500 shadow-none dark:border-primary-500 dark:text-primary-400 dark:hover:bg-primary-900/40 dark:focus:ring-offset-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm dark:focus:ring-offset-slate-900',
    success: 'bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 focus:ring-secondary-500 shadow-sm dark:focus:ring-offset-slate-900',
    ghost: 'bg-transparent text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus:ring-gray-400 shadow-none dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:focus:ring-offset-slate-900'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-sm',
    xl: 'px-8 py-3.5 text-base',
    icon: 'p-2.5 text-sm'
  };
  
  const classes = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 h-4 w-4 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
