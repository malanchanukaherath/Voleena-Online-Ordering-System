import React from 'react';

const StatusBadge = ({ status, type = 'order' }) => {
    const getOrderStatusStyles = (status) => {
        const normalized = status?.toUpperCase().replace(/_/g, '_');

        const styles = {
            PENDING: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
            PREORDER_PENDING: 'bg-amber-50 text-amber-800 border border-amber-200',
            PREORDER_CONFIRMED: 'bg-cyan-50 text-cyan-800 border border-cyan-200',
            CONFIRMED: 'bg-blue-50 text-blue-800 border border-blue-200',
            PREPARING: 'bg-orange-50 text-orange-800 border border-orange-200',
            READY: 'bg-purple-50 text-purple-800 border border-purple-200',
            OUT_FOR_DELIVERY: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
            DELIVERED: 'bg-green-50 text-green-800 border border-green-200',
            CANCELLED: 'bg-red-50 text-red-800 border border-red-200',
            COMPLETED: 'bg-green-50 text-green-800 border border-green-200',
        };

        return styles[normalized] || 'bg-gray-50 text-gray-700 border border-gray-200';
    };

    const getPaymentStatusStyles = (status) => {
        const styles = {
            PENDING: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
            PAID: 'bg-green-50 text-green-800 border border-green-200',
            FAILED: 'bg-red-50 text-red-800 border border-red-200',
            REFUNDED: 'bg-gray-50 text-gray-700 border border-gray-200',
        };

        return styles[status?.toUpperCase()] || 'bg-gray-50 text-gray-700 border border-gray-200';
    };

    const getDeliveryStatusStyles = (status) => {
        const styles = {
            PENDING: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
            ASSIGNED: 'bg-blue-50 text-blue-800 border border-blue-200',
            PICKED_UP: 'bg-orange-50 text-orange-800 border border-orange-200',
            IN_TRANSIT: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
            DELIVERED: 'bg-green-50 text-green-800 border border-green-200',
            FAILED: 'bg-red-50 text-red-800 border border-red-200',
        };

        return styles[status?.toUpperCase()] || 'bg-gray-50 text-gray-700 border border-gray-200';
    };

    const getStyles = () => {
        switch (type) {
            case 'payment':
                return getPaymentStatusStyles(status);
            case 'delivery':
                return getDeliveryStatusStyles(status);
            case 'order':
            default:
                return getOrderStatusStyles(status);
        }
    };

    const formatStatus = (status) => {
        if (!status) return 'Unknown';
        return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ring-1 ring-inset ring-black/5 ${getStyles()}`}
        >
            {formatStatus(status)}
        </span>
    );
};

export default StatusBadge;
