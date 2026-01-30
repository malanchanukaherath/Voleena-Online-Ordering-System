import React from 'react';

const Textarea = ({
    label,
    name,
    value,
    onChange,
    error,
    helperText,
    required = false,
    disabled = false,
    rows = 4,
    maxLength,
    placeholder = '',
    className = '',
    ...props
}) => {
    const charCount = value?.length || 0;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                rows={rows}
                maxLength={maxLength}
                placeholder={placeholder}
                className={`
          block w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          resize-y
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
                {...props}
            />
            <div className="flex justify-between items-center mt-1">
                <div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
                </div>
                {maxLength && (
                    <span className={`text-xs ${charCount > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {charCount}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
};

export default Textarea;
