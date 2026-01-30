import React from 'react';
import { FaMapMarkedAlt, FaPhone } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

const ActiveDeliveries = () => {
    const deliveries = [
        { id: 1, orderNumber: 'ORD-001', customer: 'John Doe', phone: '+94 71 234 5678', address: '123 Main St, Kalagedihena', status: 'PICKED_UP' },
        { id: 2, orderNumber: 'ORD-002', customer: 'Jane Smith', phone: '+94 77 345 6789', address: '456 Oak Ave, Gampaha', status: 'IN_TRANSIT' },
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">My Active Deliveries</h1>
            <div className="space-y-4">
                {deliveries.map(delivery => (
                    <div key={delivery.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{delivery.orderNumber}</h3>
                                <p className="text-gray-700">{delivery.customer}</p>
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <FaPhone className="mr-2" />{delivery.phone}
                                </p>
                            </div>
                            <StatusBadge status={delivery.status} type="delivery" />
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 flex items-center">
                                <FaMapMarkedAlt className="mr-2" />{delivery.address}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm">Mark Delivered</Button>
                            <Button size="sm" variant="outline" onClick={() => window.open(`tel:${delivery.phone}`)}>Call Customer</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveDeliveries;
