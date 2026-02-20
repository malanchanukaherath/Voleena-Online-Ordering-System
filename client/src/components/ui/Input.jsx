import React from 'react';

const Input = ({ 
  label, 
  error, 
  helperText,
  className = '',
  containerClassName = '',
  icon: Icon,
  ...props 
}) => {
  const inputClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
    ${Icon ? 'pl-10' : ''}
    ${className}
  `;

  const iconClasses = 'absolute left-3 top-[38px] text-gray-500';
  
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={inputClasses}
          {...props}
        />
        {Icon && typeof Icon === 'function' && <Icon className={iconClasses} />}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
