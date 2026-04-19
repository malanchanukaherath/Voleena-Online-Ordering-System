import React from 'react';

// Code Review: Function StatusBadge in client\src\components\ui\StatusBadge.jsx. Used in: client/src/components/ui/StatusBadge.jsx, client/src/pages/ActiveDeliveries.jsx, client/src/pages/AdminDashboard.jsx.
const StatusBadge = ({ status, type = 'order' }) => {
    // Code Review: Function getOrderStatusConfig in client\src\components\ui\StatusBadge.jsx. Used in: client/src/components/ui/StatusBadge.jsx.
    const getOrderStatusConfig = (status) => {
        const normalized = status?.toUpperCase().replace(/_/g, '_');

        const configs = {
            PENDING:            { bg: 'bg-amber-50 dark:bg-amber-950/40',   text: 'text-amber-700 dark:text-amber-300',  border: 'border-amber-200 dark:border-amber-800/70',  dot: 'bg-amber-500'  },
            PREORDER_PENDING:   { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800/70', dot: 'bg-orange-500' },
            PREORDER_CONFIRMED: { bg: 'bg-cyan-50 dark:bg-cyan-950/40',     text: 'text-cyan-700 dark:text-cyan-300',   border: 'border-cyan-200 dark:border-cyan-800/70',   dot: 'bg-cyan-500'   },
            CONFIRMED:          { bg: 'bg-blue-50 dark:bg-blue-950/40',     text: 'text-blue-700 dark:text-blue-300',   border: 'border-blue-200 dark:border-blue-800/70',   dot: 'bg-blue-500'   },
            PREPARING:          { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800/70', dot: 'bg-orange-500' },
            READY:              { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/70', dot: 'bg-purple-500' },
            OUT_FOR_DELIVERY:   { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/70', dot: 'bg-indigo-500' },
            DELIVERED:          { bg: 'bg-green-50 dark:bg-green-950/40',   text: 'text-green-700 dark:text-green-300',  border: 'border-green-200 dark:border-green-800/70',  dot: 'bg-green-500'  },
            CANCELLED:          { bg: 'bg-red-50 dark:bg-red-950/40',       text: 'text-red-700 dark:text-red-300',    border: 'border-red-200 dark:border-red-800/70',    dot: 'bg-red-500'    },
            COMPLETED:          { bg: 'bg-green-50 dark:bg-green-950/40',   text: 'text-green-700 dark:text-green-300',  border: 'border-green-200 dark:border-green-800/70',  dot: 'bg-green-500'  },
        };

        return configs[normalized] || { bg: 'bg-gray-50 dark:bg-slate-800', text: 'text-gray-600 dark:text-slate-400', border: 'border-gray-200 dark:border-slate-600', dot: 'bg-gray-400' };
    };

    // Code Review: Function getPaymentStatusConfig in client\src\components\ui\StatusBadge.jsx. Used in: client/src/components/ui/StatusBadge.jsx.
    const getPaymentStatusConfig = (status) => {
        const configs = {
            PENDING:  { bg: 'bg-amber-50 dark:bg-amber-950/40',  text: 'text-amber-700 dark:text-amber-300',  border: 'border-amber-200 dark:border-amber-800/70',  dot: 'bg-amber-500'  },
            PAID:     { bg: 'bg-green-50 dark:bg-green-950/40',  text: 'text-green-700 dark:text-green-300',  border: 'border-green-200 dark:border-green-800/70',  dot: 'bg-green-500'  },
            FAILED:   { bg: 'bg-red-50 dark:bg-red-950/40',      text: 'text-red-700 dark:text-red-300',      border: 'border-red-200 dark:border-red-800/70',      dot: 'bg-red-500'    },
            REFUNDED: { bg: 'bg-slate-50 dark:bg-slate-800',     text: 'text-slate-600 dark:text-slate-400',  border: 'border-slate-200 dark:border-slate-600',     dot: 'bg-slate-400'  },
        };

        return configs[status?.toUpperCase()] || { bg: 'bg-gray-50 dark:bg-slate-800', text: 'text-gray-600 dark:text-slate-400', border: 'border-gray-200 dark:border-slate-600', dot: 'bg-gray-400' };
    };

    // Code Review: Function getDeliveryStatusConfig in client\src\components\ui\StatusBadge.jsx. Used in: client/src/components/ui/StatusBadge.jsx.
    const getDeliveryStatusConfig = (status) => {
        const configs = {
            PENDING:    { bg: 'bg-amber-50 dark:bg-amber-950/40',   text: 'text-amber-700 dark:text-amber-300',  border: 'border-amber-200 dark:border-amber-800/70',  dot: 'bg-amber-500'  },
            ASSIGNED:   { bg: 'bg-blue-50 dark:bg-blue-950/40',     text: 'text-blue-700 dark:text-blue-300',   border: 'border-blue-200 dark:border-blue-800/70',   dot: 'bg-blue-500'   },
            PICKED_UP:  { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800/70', dot: 'bg-orange-500' },
            IN_TRANSIT: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/70', dot: 'bg-indigo-500' },
            DELIVERED:  { bg: 'bg-green-50 dark:bg-green-950/40',   text: 'text-green-700 dark:text-green-300',  border: 'border-green-200 dark:border-green-800/70',  dot: 'bg-green-500'  },
            FAILED:     { bg: 'bg-red-50 dark:bg-red-950/40',       text: 'text-red-700 dark:text-red-300',    border: 'border-red-200 dark:border-red-800/70',    dot: 'bg-red-500'    },
        };

        return configs[status?.toUpperCase()] || { bg: 'bg-gray-50 dark:bg-slate-800', text: 'text-gray-600 dark:text-slate-400', border: 'border-gray-200 dark:border-slate-600', dot: 'bg-gray-400' };
    };

    // Code Review: Function getConfig in client\src\components\ui\StatusBadge.jsx. Used in: client/src/components/ui/StatusBadge.jsx.
    const getConfig = () => {
        switch (type) {
            case 'payment':  return getPaymentStatusConfig(status);
            case 'delivery': return getDeliveryStatusConfig(status);
            case 'order':
            default:         return getOrderStatusConfig(status);
        }
    };

    // Code Review: Function formatStatus in client\src\components\ui\StatusBadge.jsx. Used in: client/src/components/ui/StatusBadge.jsx.
    const formatStatus = (status) => {
        if (!status) return 'Unknown';
        return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };

    const config = getConfig();

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${config.bg} ${config.text} ${config.border}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
            {formatStatus(status)}
        </span>
    );
};

export default StatusBadge;
