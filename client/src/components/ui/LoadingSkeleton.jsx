import React from 'react';

const LoadingSkeleton = ({ type = 'card', count = 1, rows = 5 }) => {
    const renderCardSkeleton = () => (
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
    );

    const renderTableSkeleton = () => (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
                <thead className="bg-gray-50">
                    <tr>
                        {[1, 2, 3, 4].map((i) => (
                            <th key={i} className="px-6 py-3">
                                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i}>
                            {[1, 2, 3, 4].map((j) => (
                                <td key={j} className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderListSkeleton = () => (
        <div className="space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFormSkeleton = () => (
        <div className="bg-white rounded-lg shadow p-6 space-y-4 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>
            ))}
            <div className="h-10 bg-gray-200 rounded w-1/3 mt-6"></div>
        </div>
    );

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
