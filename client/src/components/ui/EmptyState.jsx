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
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-dashed border-gray-300 bg-white/90 shadow-sm dark:bg-slate-800/80 dark:border-slate-600">
            <DefaultIcon className={`w-14 h-14 ${getColors()} mb-4`} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center dark:text-slate-100">{title}</h3>
            {description && (
                <p className="text-sm text-gray-600 text-center max-w-md mb-6 leading-6 dark:text-slate-400">
                    {description}
                </p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
};

export default EmptyState;
