import React from 'react';

const Select = ({
    label,
    name,
    value,
    onChange,
    options = [],
    error,
    helperText,
    placeholder,
    required = false,
    disabled = false,
    className = '',
    ...props
}) => {
    const selectId = props.id || name;
    const errorId = selectId && error ? `${selectId}-error` : null;
    const helperId = selectId && helperText && !error ? `${selectId}-description` : null;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={selectId} className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <select
                id={selectId}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={describedBy}
                className={`
                block w-full px-3 py-2.5 border rounded-xl shadow-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
                {...props}
            >
                <option value="">{placeholder || `Select ${label || 'option'}`}</option>
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p id={errorId || undefined} className="mt-1 text-sm text-red-600">{error}</p>}
            {helperText && !error && <p id={helperId || undefined} className="mt-1 text-sm text-gray-500">{helperText}</p>}
        </div>
    );
};

export default Select;
