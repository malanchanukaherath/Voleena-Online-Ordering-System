import React from 'react';

const StatusBadge = ({ status, type = 'order' }) => {
    const getOrderStatusStyles = (status) => {
        const normalized = status?.toUpperCase().replace(/_/g, '_');

        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            CONFIRMED: 'bg-blue-100 text-blue-800',
            PREPARING: 'bg-orange-100 text-orange-800',
            READY: 'bg-purple-100 text-purple-800',
            OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
            DELIVERED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
            COMPLETED: 'bg-green-100 text-green-800',
        };

        return styles[normalized] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentStatusStyles = (status) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            PAID: 'bg-green-100 text-green-800',
            FAILED: 'bg-red-100 text-red-800',
            REFUNDED: 'bg-gray-100 text-gray-800',
        };

        return styles[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
    };

    const getDeliveryStatusStyles = (status) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            ASSIGNED: 'bg-blue-100 text-blue-800',
            PICKED_UP: 'bg-orange-100 text-orange-800',
            IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
            DELIVERED: 'bg-green-100 text-green-800',
            FAILED: 'bg-red-100 text-red-800',
        };

        return styles[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
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
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStyles()}`}
        >
            {formatStatus(status)}
        </span>
    );
};

export default StatusBadge;
