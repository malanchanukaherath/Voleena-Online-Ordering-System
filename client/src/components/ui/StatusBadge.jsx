import React from 'react';

const StatusBadge = ({ status, type = 'order' }) => {
    const getOrderStatusConfig = (status) => {
        const normalized = status?.toUpperCase().replace(/_/g, '_');

        const configs = {
            PENDING:            { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
            PREORDER_PENDING:   { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
            PREORDER_CONFIRMED: { bg: 'bg-cyan-50',    text: 'text-cyan-700',   border: 'border-cyan-200',   dot: 'bg-cyan-500'   },
            CONFIRMED:          { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
            PREPARING:          { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
            READY:              { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
            OUT_FOR_DELIVERY:   { bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
            DELIVERED:          { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500'  },
            CANCELLED:          { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'    },
            COMPLETED:          { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500'  },
        };

        return configs[normalized] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };
    };

    const getPaymentStatusConfig = (status) => {
        const configs = {
            PENDING:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
            PAID:     { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500'  },
            FAILED:   { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'    },
            REFUNDED: { bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400'  },
        };

        return configs[status?.toUpperCase()] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };
    };

    const getDeliveryStatusConfig = (status) => {
        const configs = {
            PENDING:    { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
            ASSIGNED:   { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
            PICKED_UP:  { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
            IN_TRANSIT: { bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
            DELIVERED:  { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500'  },
            FAILED:     { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'    },
        };

        return configs[status?.toUpperCase()] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };
    };

    const getConfig = () => {
        switch (type) {
            case 'payment':  return getPaymentStatusConfig(status);
            case 'delivery': return getDeliveryStatusConfig(status);
            case 'order':
            default:         return getOrderStatusConfig(status);
        }
    };

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
