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
    FaCashRegister,
} from 'react-icons/fa';

const Sidebar = ({ className = '', onNavigate }) => {
    const { user } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const getMenuItems = () => {
        const role = user?.role || user?.staffRole;

        switch (role) {
            case 'Admin':
                return [
                    { path: '/admin', label: 'Dashboard', icon: FaTachometerAlt, group: 'Overview' },
                    { path: '/admin/orders', label: 'Orders', icon: FaClipboardList, group: 'Operations' },
                    { path: '/admin/customers', label: 'Customers', icon: FaUsers, group: 'Operations' },
                    { path: '/admin/staff', label: 'Staff', icon: FaUserTie, group: 'Operations' },
                    { path: '/admin/menu', label: 'Menu', icon: FaUtensils, group: 'Menu & Inventory' },
                    { path: '/admin/categories', label: 'Categories', icon: FaTags, group: 'Menu & Inventory' },
                    { path: '/admin/combos', label: 'Combo Packs', icon: FaBoxes, group: 'Menu & Inventory' },
                    { path: '/admin/stock', label: 'Stock', icon: FaBoxes, group: 'Menu & Inventory' },
                    { path: '/admin/analytics', label: 'Analytics', icon: FaChartLine, group: 'Insights' },
                    { path: '/admin/feedback', label: 'Feedback', icon: FaComments, group: 'Insights' },
                    { path: '/admin/settings', label: 'Settings', icon: FaCog, group: 'Settings' },
                ];

            case 'Cashier':
                return [
                    { path: '/cashier', label: 'Dashboard', icon: FaTachometerAlt },
                    { path: '/cashier/pos', label: 'POS', icon: FaCashRegister },
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

    let previousGroup = null;

    return (
        <aside className={className}>
            <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    const showGroup = item.group && item.group !== previousGroup;
                    previousGroup = item.group || previousGroup;

                    return (
                        <React.Fragment key={item.path}>
                            {showGroup && (
                                <div className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 first:pt-0">
                                    {item.group}
                                </div>
                            )}
                            <Link
                                to={item.path}
                                onClick={onNavigate}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active
                                    ? 'bg-primary-100 text-primary-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                                <span>{item.label}</span>
                            </Link>
                        </React.Fragment>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
