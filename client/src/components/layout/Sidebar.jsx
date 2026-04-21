// CODEMAP: FRONTEND_COMPONENTS_LAYOUT_SIDEBAR_JSX
// WHAT_THIS_IS: This file supports frontend behavior for Sidebar.jsx.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: components/layout/Sidebar.jsx
// - Search text: Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    FaTachometerAlt,
    FaClipboardList,
    FaCalendarAlt,
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

// CODEMAP: FRONTEND_SIDEBAR
// WHAT_THIS_IS: Left menu for dashboard users (Admin/Cashier/Kitchen/Delivery).
// WHERE_CONNECTED:
// - Rendered by MainLayout when current route is a dashboard path.
// - Uses logged-in user role from AuthContext to decide menu items.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: client/src/components/layout/Sidebar.jsx
// - Search text: const Sidebar = ({ className = '', onNavigate })
// Simple: This shows the sidebar section.
const Sidebar = ({ className = '', onNavigate }) => {
    const { user } = useAuth();
    const location = useLocation();

    // Simple: This checks whether active is true.
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    // Simple: This gets the menu items.
    // Non-technical meaning: this is the "menu list by job role" map.
    const getMenuItems = () => {
        const role = user?.role || user?.staffRole;

        switch (role) {
            case 'Admin':
                return [
                    { path: '/admin', label: 'Dashboard', icon: FaTachometerAlt, group: 'Overview' },
                    { path: '/admin/orders', label: 'Orders', icon: FaClipboardList, group: 'Operations' },
                    { path: '/admin/preorders', label: 'Preorders', icon: FaCalendarAlt, group: 'Operations' },
                    { path: '/admin/customers', label: 'Customers', icon: FaUsers, group: 'Operations' },
                    { path: '/admin/staff', label: 'Staff', icon: FaUserTie, group: 'Operations' },
                    { path: '/admin/menu', label: 'Menu', icon: FaUtensils, group: 'Menu & Inventory' },
                    { path: '/admin/addons', label: 'Add-ons', icon: FaTags, group: 'Menu & Inventory' },
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
        // Customers and guests do not need the dashboard sidebar.
        return null; // Don't show sidebar for customers or unauthenticated users
    }

    let previousGroup = null;

    return (
        <aside className={className}>
            <nav className="px-3 py-4 space-y-0.5">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    const showGroup = item.group && item.group !== previousGroup;
                    previousGroup = item.group || previousGroup;

                    return (
                        <React.Fragment key={item.path}>
                            {showGroup && (
                                <div className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 first:pt-2 dark:text-slate-600">
                                    {item.group}
                                </div>
                            )}
                            <Link
                                to={item.path}
                                // onNavigate is used by mobile view to close sidebar after clicking a link.
                                onClick={onNavigate}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border-l-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 ${active
                                    ? 'bg-primary-50 border-l-primary-600 text-primary-700 font-semibold dark:bg-primary-900/30 dark:border-l-primary-400 dark:text-primary-300'
                                    : 'border-l-transparent text-gray-600 hover:bg-slate-50 hover:text-gray-900 hover:border-l-gray-300 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:hover:border-l-slate-600'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:text-slate-600 dark:group-hover:text-slate-400'}`} />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        </React.Fragment>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;

