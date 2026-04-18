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
    bg-white rounded-lg border border-gray-200 motion-surface
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
