// CODEMAP: FRONTEND_COMPONENTS_UI_CARD_JSX
// WHAT_THIS_IS: This file supports frontend behavior for Card.jsx.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: components/ui/Card.jsx
// - Search text: Card.jsx
import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'md',
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };
  
  const classes = `
    bg-white rounded-2xl border border-gray-200/90 motion-surface shadow-sm
    dark:bg-slate-800 dark:border-slate-700
    ${paddingClasses[padding]} 
    ${shadowClasses[shadow]} 
    ${className}
  `;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;

