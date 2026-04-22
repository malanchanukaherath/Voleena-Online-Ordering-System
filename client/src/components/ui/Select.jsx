// CODEMAP: FRONTEND_COMPONENTS_UI_SELECT_JSX
// WHAT_THIS_IS: This file supports frontend behavior for Select.jsx.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: components/ui/Select.jsx
// - Search text: Select.jsx
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
                <label htmlFor={selectId} className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-slate-300">
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
                block w-full px-3 py-2.5 border rounded-xl shadow-sm bg-white text-sm
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed
          dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100
          dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:hover:border-slate-500
          dark:disabled:bg-slate-700 dark:disabled:text-slate-500
          ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300'}
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
            {helperText && !error && <p id={helperId || undefined} className="mt-1 text-sm text-gray-500 dark:text-slate-500">{helperText}</p>}
        </div>
    );
};

export default Select;

