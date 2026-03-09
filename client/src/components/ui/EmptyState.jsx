import React from 'react';
import { FaInbox, FaExclamationCircle, FaSearch } from 'react-icons/fa';

const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    type = 'default', // 'default', 'error', 'search'
}) => {
    const getIcon = () => {
        if (Icon) return Icon;
        switch (type) {
            case 'error':
                return FaExclamationCircle;
            case 'search':
                return FaSearch;
            default:
                return FaInbox;
        }
    };

    const DefaultIcon = getIcon();

    const getColors = () => {
        switch (type) {
            case 'error':
                return 'text-red-400';
            case 'search':
                return 'text-blue-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <DefaultIcon className={`w-16 h-16 ${getColors()} mb-4`} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                    {description}
                </p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
};

export default EmptyState;
