import React from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaMapMarkedAlt, FaCheckCircle, FaClock } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';

const DeliveryDashboard = () => {
    const stats = {
        activeDeliveries: 6,
        completedToday: 23,
        pendingPickup: 2,
    };

    const activeDeliveries = [
        { id: 1, orderNumber: 'ORD-001', customer: 'John Doe', address: '123 Main St', status: 'IN_TRANSIT' },
        { id: 2, orderNumber: 'ORD-002', customer: 'Jane Smith', address: '456 Oak Ave', status: 'PICKED_UP' },
    ];

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Delivery Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <FaTruck className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600">Active Deliveries</p>
                    <p className="text-3xl font-bold">{stats.activeDeliveries}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaClock className="w-8 h-8 text-orange-600 mb-2" />
                    <p className="text-sm text-gray-600">Pending Pickup</p>
                    <p className="text-3xl font-bold">{stats.pendingPickup}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaCheckCircle className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-sm text-gray-600">Completed Today</p>
                    <p className="text-3xl font-bold">{stats.completedToday}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Active Deliveries</h3>
                    <div className="space-y-3">
                        {activeDeliveries.map(delivery => (
                            <div key={delivery.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold">{delivery.orderNumber}</p>
                                        <p className="text-sm text-gray-600">{delivery.customer}</p>
                                        <p className="text-xs text-gray-500">{delivery.address}</p>
                                    </div>
                                    <StatusBadge status={delivery.status} type="delivery" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/delivery/active" className="block mt-4 text-primary-600 hover:text-primary-700">
                        View All →
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/delivery/active" className="p-4 border-2 rounded-lg hover:border-primary-500 text-center">
                            <FaTruck className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">My Deliveries</p>
                        </Link>
                        <Link to="/delivery/map" className="p-4 border-2 rounded-lg hover:border-primary-500 text-center">
                            <FaMapMarkedAlt className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">View Map</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryDashboard;
