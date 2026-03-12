import React from 'react';
import Button from './Button';

const FilterResetButton = ({
    onClick,
    disabled = false,
    label = 'Clear Filters',
    className = ''
}) => {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={`whitespace-nowrap ${className}`.trim()}
        >
            {label}
        </Button>
    );
};

export default FilterResetButton;