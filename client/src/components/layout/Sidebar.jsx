import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    FaTachometerAlt,
    FaClipboardList,
    FaUsers,
    FaUserTie,
    FaUtensils,
    FaChartLine,
    FaTags,
    FaBoxes,
    FaComments,
    FaCog,
    FaTruck,
    FaMapMarkedAlt,
} from 'react-icons/fa';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const getMenuItems = () => {
        const role = user?.role || user?.staffRole;

        switch (role) {
            case 'Admin':
                return [
                    { path: '/admin', label: 'Dashboard', icon: FaTachometerAlt },
                    { path: '/admin/orders', label: 'Orders', icon: FaClipboardList },
                    { path: '/admin/customers', label: 'Customers', icon: FaUsers },
                    { path: '/admin/staff', label: 'Staff', icon: FaUserTie },
                    { path: '/admin/menu', label: 'Menu', icon: FaUtensils },
                    { path: '/admin/categories', label: 'Categories', icon: FaTags },
                    { path: '/admin/combos', label: 'Combo Packs', icon: FaBoxes },
                    { path: '/admin/stock', label: 'Stock', icon: FaBoxes },
                    { path: '/admin/analytics', label: 'Analytics', icon: FaChartLine },
                    { path: '/admin/feedback', label: 'Feedback', icon: FaComments },
                    { path: '/admin/settings', label: 'Settings', icon: FaCog },
                ];

            case 'Cashier':
                return [
                    { path: '/cashier', label: 'Dashboard', icon: FaTachometerAlt },
                    { path: '/cashier/orders', label: 'Orders', icon: FaClipboardList },
                    { path: '/cashier/customers/new', label: 'New Customer', icon: FaUsers },
                ];

            case 'Kitchen':
                return [
                    { path: '/kitchen', label: 'Dashboard', icon: FaTachometerAlt },
                    { path: '/kitchen/orders', label: 'Orders', icon: FaClipboardList },
                    { path: '/kitchen/stock', label: 'Stock', icon: FaBoxes },
                ];

            case 'Delivery':
                return [
                    { path: '/delivery', label: 'Dashboard', icon: FaTachometerAlt },
                    { path: '/delivery/active', label: 'Active Deliveries', icon: FaTruck },
                    { path: '/delivery/map', label: 'Map', icon: FaMapMarkedAlt },
                ];

            default:
                return [];
        }
    };

    const menuItems = getMenuItems();

    if (menuItems.length === 0) {
        return null; // Don't show sidebar for customers or unauthenticated users
    }

    return (
        <aside className="hidden lg:block w-64 bg-white shadow-lg min-h-[calc(100vh-4rem)] sticky top-16 self-start">
            <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active
                                ? 'bg-primary-100 text-primary-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
