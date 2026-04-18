import React from 'react';

const Input = ({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  icon,
  ...props
}) => {
  const iconIsElement = React.isValidElement(icon);
  const Icon = !iconIsElement && typeof icon === 'function' ? icon : null;
  const inputId = props.id || props.name;
  const errorId = inputId && error ? `${inputId}-error` : null;
  const helperId = inputId && helperText && !error ? `${inputId}-description` : null;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
  const inputClasses = `
    block w-full ${Icon ? 'pl-10 pr-3' : 'px-3.5'} py-2.5 
    border rounded-xl placeholder-gray-400 bg-white text-gray-900 text-sm
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-0
    dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500
    ${error
      ? 'border-red-300 focus:ring-red-400 focus:border-red-400 bg-red-50/30 dark:bg-red-950/20 dark:border-red-500 dark:focus:ring-red-500'
      : 'border-gray-200 focus:ring-primary-400 focus:border-primary-400 hover:border-gray-300 dark:border-slate-600 dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:hover:border-slate-500'
    }
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-slate-700 dark:disabled:text-slate-500
    ${className}
  `;

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 mb-1.5 leading-none dark:text-slate-300">
          {label}
          {props.required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {(iconIsElement || Icon) && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none dark:text-slate-500" aria-hidden="true">
            {iconIsElement ? icon : <Icon className="w-4 h-4" />}
          </span>
        )}
        <input
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId || undefined} role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1 break-words">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId || undefined} className="mt-1.5 text-xs text-gray-500 break-words dark:text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
