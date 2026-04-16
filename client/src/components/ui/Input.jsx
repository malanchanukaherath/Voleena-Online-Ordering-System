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
    block w-full ${Icon ? 'pl-10 pr-3' : 'px-3'} py-2 border rounded-md shadow-sm placeholder-gray-400 
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
    ${className}
  `;

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {(iconIsElement || Icon) && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400" aria-hidden="true">
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
        <p id={errorId || undefined} className="mt-1 text-sm text-red-600 break-words">{error}</p>
      )}
      {helperText && !error && (
        <p id={helperId || undefined} className="mt-1 text-sm text-gray-500 break-words">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
