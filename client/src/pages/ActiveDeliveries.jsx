import React, { useEffect, useState } from 'react';
import { FaMapMarkedAlt, FaPhone } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { deliveryService } from '../services/dashboardService';

const ActiveDeliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadDeliveries = async () => {
            try {
                const response = await deliveryService.getMyDeliveries();
                const data = response.data || response?.data?.data || [];
                const mapped = data.map((delivery) => ({
                    id: delivery.DeliveryID,
                    orderNumber: delivery.order?.OrderNumber || 'N/A',
                    customer: delivery.order?.customer?.Name || 'Unknown',
                    phone: delivery.order?.customer?.Phone || 'N/A',
                    address: delivery.address
                        ? [delivery.address.AddressLine1, delivery.address.City].filter(Boolean).join(', ')
                        : 'N/A',
                    status: delivery.Status
                }));

                if (isMounted) {
                    setDeliveries(mapped);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Failed to load deliveries');
                }
            }
        };

        loadDeliveries();

        return () => {
            isMounted = false;
        };
    }, []);

    const getNextStatus = (status) => {
        const map = {
            ASSIGNED: 'PICKED_UP',
            PICKED_UP: 'IN_TRANSIT',
            IN_TRANSIT: 'DELIVERED'
        };
        return map[status];
    };

    const handleAdvanceStatus = async (deliveryId, status) => {
        const nextStatus = getNextStatus(status);
        if (!nextStatus) return;

        try {
            await deliveryService.updateDeliveryStatus(deliveryId, { status: nextStatus });
            setDeliveries((prev) => prev.map((delivery) => (
                delivery.id === deliveryId ? { ...delivery, status: nextStatus } : delivery
            )));
        } catch (err) {
            setError(err.message || 'Failed to update delivery status');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">My Active Deliveries</h1>
            <div className="space-y-4">
                {deliveries.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
                        {error || 'No active deliveries.'}
                    </div>
                ) : deliveries.map(delivery => (
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
                            <Button
                                size="sm"
                                onClick={() => handleAdvanceStatus(delivery.id, delivery.status)}
                                disabled={!getNextStatus(delivery.status)}
                            >
                                Advance Status
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => window.open(`tel:${delivery.phone}`)}>Call Customer</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveDeliveries;
