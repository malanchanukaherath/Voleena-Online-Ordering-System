import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaBoxes, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import { kitchenService } from '../services/dashboardService';

const DEFAULT_STATS = {
    activeOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
};

const KitchenDashboard = () => {
    const [stats, setStats] = useState(DEFAULT_STATS);
    const [activeOrders, setActiveOrders] = useState([]);

    const normalizeSpecialInstructions = (order) => {
        const rawValue = order?.SpecialInstructions ?? order?.specialInstructions ?? order?.special_instructions ?? '';
        const normalized = String(rawValue || '').trim();
        return normalized || '';
    };

    useEffect(() => {
        let isMounted = true;

        const loadDashboard = async () => {
            try {
                const [statsResponse, ordersResponse] = await Promise.all([
                    kitchenService.getDashboardStats(),
                    kitchenService.getAssignedOrders()
                ]);

                const statsData = statsResponse.stats || statsResponse.data?.stats || statsResponse.data || DEFAULT_STATS;
                const orders = ordersResponse.data || ordersResponse?.data?.data || [];
                const mappedOrders = orders
                    .map((order) => ({
                        id: order.OrderID,
                        orderNumber: order.OrderNumber,
                        items: (order.items || order.orderItems || []).reduce((sum, item) => sum + (item.Quantity || 0), 0),
                        time: order.CreatedAt || order.createdAt || order.created_at,
                        status: order.Status,
                        orderType: order.OrderType,
                        specialInstructions: normalizeSpecialInstructions(order),
                        priority: order.Status === 'CONFIRMED' ? 'high' : 'normal'
                    }))
                    .sort((a, b) => {
                        const aTime = new Date(a.time || 0).getTime();
                        const bTime = new Date(b.time || 0).getTime();
                        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
                    });

                if (isMounted) {
                    setStats(statsData);
                    setActiveOrders(mappedOrders);
                }
            } catch {
                if (isMounted) {
                    setActiveOrders([]);
                }
            }
        };

        loadDashboard();

        const intervalId = setInterval(loadDashboard, 5000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Kitchen Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <FaClipboardList className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600">Active Orders</p>
                    <p className="text-3xl font-bold">{stats.activeOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaClock className="w-8 h-8 text-orange-600 mb-2" />
                    <p className="text-sm text-gray-600">Preparing</p>
                    <p className="text-3xl font-bold">{stats.preparingOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaBoxes className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-sm text-gray-600">Ready</p>
                    <p className="text-3xl font-bold">{stats.readyOrders}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    {activeOrders.some(o => o.priority === 'high') && (
                        <>
                            <FaExclamationTriangle className="text-red-600 mr-2 animate-pulse" />
                            Current Orders (Action Required First)
                        </>
                    )}
                    {!activeOrders.some(o => o.priority === 'high') && 'Current Orders'}
                </h3>
                <div className="space-y-3">
                    {activeOrders.length === 0 ? (
                        <div className="text-sm text-gray-500">No active kitchen orders.</div>
                    ) : activeOrders.map(order => (
                        <div key={order.id} className={`p-4 rounded-lg border-2 ${order.priority === 'high' ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {order.priority === 'high' && (
                                            <FaExclamationTriangle className="text-red-600" />
                                        )}
                                        <p className="font-bold">{order.orderNumber}</p>
                                        {order.orderType === 'WALK_IN' && (
                                            <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                                WALK-IN
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {order.items} items • {order.time ? new Date(order.time).toLocaleString() : 'N/A'}
                                    </p>
                                    {order.specialInstructions && (
                                        <p className="mt-1 text-xs text-amber-800 break-words">
                                            <span className="font-semibold">Instructions:</span> {order.specialInstructions}
                                        </p>
                                    )}
                                </div>
                                <StatusBadge status={order.status} />
                            </div>
                        </div>
                    ))}
                </div>
                <Link to="/kitchen/orders" className="block mt-4 text-primary-600 hover:text-primary-700">
                    View All Orders →
                </Link>
            </div>
        </div>
    );
};

export default KitchenDashboard;
