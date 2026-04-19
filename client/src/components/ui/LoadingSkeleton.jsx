import React from 'react';

// Code Review: Function LoadingSkeleton in client\src\components\ui\LoadingSkeleton.jsx. Used in: client/src/components/ui/LoadingSkeleton.jsx, client/src/pages/AddOnManagement.jsx, client/src/pages/CategoryManagement.jsx.
const LoadingSkeleton = ({ type = 'card', count = 1, rows = 5 }) => {
    // Code Review: Function renderCardSkeleton in client\src\components\ui\LoadingSkeleton.jsx. Used in: client/src/components/ui/LoadingSkeleton.jsx.
    const renderCardSkeleton = () => (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-pulse dark:bg-slate-800 dark:border-slate-700">
            <div className="h-44 bg-gray-200 rounded-xl mb-4 dark:bg-slate-700"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 dark:bg-slate-700"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 dark:bg-slate-700"></div>
            <div className="h-9 bg-gray-200 rounded-xl w-1/4 dark:bg-slate-700"></div>
        </div>
    );

    // Code Review: Function renderTableSkeleton in client\src\components\ui\LoadingSkeleton.jsx. Used in: client/src/components/ui/LoadingSkeleton.jsx.
    const renderTableSkeleton = () => (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                        {[1, 2, 3, 4].map((i) => (
                            <th key={i} className="px-6 py-3">
                                <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-slate-600"></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i}>
                            {[1, 2, 3, 4].map((j) => (
                                <td key={j} className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-slate-700"></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Code Review: Function renderListSkeleton in client\src\components\ui\LoadingSkeleton.jsx. Used in: client/src/components/ui/LoadingSkeleton.jsx.
    const renderListSkeleton = () => (
        <div className="space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 animate-pulse dark:bg-slate-800 dark:border-slate-700">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full dark:bg-slate-700"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-slate-700"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-slate-700"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Code Review: Function renderFormSkeleton in client\src\components\ui\LoadingSkeleton.jsx. Used in: client/src/components/ui/LoadingSkeleton.jsx.
    const renderFormSkeleton = () => (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 animate-pulse dark:bg-slate-800 dark:border-slate-700">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 dark:bg-slate-700"></div>
                    <div className="h-10 bg-gray-200 rounded dark:bg-slate-700"></div>
                </div>
            ))}
            <div className="h-10 bg-gray-200 rounded w-1/3 mt-6 dark:bg-slate-700"></div>
        </div>
    );

    // Code Review: Function renderSkeleton in client\src\components\ui\LoadingSkeleton.jsx. Used in: client/src/components/ui/LoadingSkeleton.jsx.
    const renderSkeleton = () => {
        switch (type) {
            case 'table':
                return renderTableSkeleton();
            case 'list':
                return renderListSkeleton();
            case 'form':
                return renderFormSkeleton();
            case 'card':
            default:
                return renderCardSkeleton();
        }
    };

    if (type === 'card') {
        return (
            <div className={`grid gap-6 ${count > 1 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i}>{renderSkeleton()}</div>
                ))}
            </div>
        );
    }

    return renderSkeleton();
};

export default LoadingSkeleton;
