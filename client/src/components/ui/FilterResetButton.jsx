import React from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from './Button';

const FilterResetButton = ({
    onClick,
    disabled = false,
    label = 'Clear Filters',
    className = ''
}) => {
    if (disabled) {
        return null;
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={`group whitespace-nowrap border border-rose-200/80 bg-gradient-to-r from-rose-50 via-white to-amber-50 text-rose-700 shadow-sm shadow-rose-100/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:from-rose-100 hover:to-amber-100 hover:text-rose-800 focus:ring-rose-300 dark:border-rose-800/60 dark:bg-none dark:bg-rose-950/30 dark:text-rose-400 dark:hover:border-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 ${className}`.trim()}
        >
            <FaTimes className="mr-2 text-xs opacity-70 transition-opacity duration-200 group-hover:opacity-100" />
            {label}
        </Button>
    );
};

export default FilterResetButton;