// CODEMAP: FRONTEND_COMPONENTS_UI_FILTERRESETBUTTON_JSX
// WHAT_THIS_IS: This file supports frontend behavior for FilterResetButton.jsx.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: components/ui/FilterResetButton.jsx
// - Search text: FilterResetButton.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from './Button';

// CODEMAP: FILTER_RESET_BUTTON
// WHAT_THIS_IS: A small reusable "clear filter" button used in list pages.
// WHERE_CONNECTED:
// - Imported by pages that show filter controls (for example Menu, Order Management, Staff Management).
// - Uses shared Button styles from components/ui/Button so it looks consistent with other buttons.
// HOW_TO_FIND_IN_FRONTEND:
// - Search text: FilterResetButton
// - File path: client/src/components/ui/FilterResetButton.jsx
const FilterResetButton = ({
    onClick,
    disabled = false,
    label = 'Clear Filters',
    className = ''
}) => {
    // If parent page says there are no active filters, hide this action button.
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
