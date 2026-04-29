// CODEMAP: FRONTEND_COMPONENTS_LAYOUT_HEADER_JSX
// WHAT_THIS_IS: This file supports frontend behavior for Header.jsx.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: components/layout/Header.jsx
// - Search text: Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getCart } from '../../utils/cartStorage';
import {
    FaHome,
    FaBars,
    FaTimes,
    FaUtensils,
    FaShoppingCart,
    FaClipboardList,
    FaUser,
    FaComments,
    FaSignOutAlt,
    FaTachometerAlt,
    FaUsers,
    FaUserTie,
    FaChartLine,
    FaTags,
    FaBoxes,
    FaMapMarkedAlt,
    FaCashRegister,
    FaSun,
    FaMoon,
} from 'react-icons/fa';
import NotificationCenter from '../ui/NotificationCenter';
import { usePublicSettings } from '../../hooks/usePublicSettings';

// CODEMAP: FRONTEND_HEADER
// WHAT_THIS_IS: The top bar shown on most pages (logo, links, cart, user actions).
// WHERE_CONNECTED:
// - Rendered by MainLayout.
// - Reads login/session data from AuthContext.
// - Reads theme mode from ThemeContext.
// - Reads public restaurant name from usePublicSettings.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: client/src/components/layout/Header.jsx
// - Search text: const Header = ({
const Header = ({
    showSidebarToggle = false,
    isSidebarVisible = true,
    isMobileSidebarOpen = false,
    onToggleSidebar = () => { },
    onToggleMobileSidebar = () => { }
}) => {
    const { user, isAuthenticated, logout } = useAuth();
    const { settings: publicSettings } = usePublicSettings();
    const { isDark, toggleTheme } = useTheme();
    const location = useLocation();
    const [cartCount, setCartCount] = useState(0);
    const userRole = user?.role || user?.staffRole;
    const shouldShowCart = !isAuthenticated || userRole === 'Customer';

    // Load cart count on mount and listen for updates.
    // Non-technical meaning: keep the cart number near the icon always in sync.
    useEffect(() => {
        // Simple: This updates the cart count.
        const updateCartCount = () => {
            const cart = getCart();
            const count = cart.reduce((total, item) => total + item.quantity, 0);
            setCartCount(count);
        };

        // Initial load
        updateCartCount();

        // Listen for storage changes (works when user adds items)
        window.addEventListener('storage', updateCartCount);

        // Listen for custom cart events
        window.addEventListener('cartUpdated', updateCartCount);

        return () => {
            window.removeEventListener('storage', updateCartCount);
            window.removeEventListener('cartUpdated', updateCartCount);
        };
    }, []);

    // Simple: This checks whether active is true.
    const isActive = (path) => location.pathname === path;

    // Navigation items based on user role.
    // Non-technical meaning: each staff type sees only links relevant to their job.
    // Simple: This gets the navigation items.
    const getNavigationItems = () => {
        if (!isAuthenticated) {
            return [
                { path: '/', label: 'Home', icon: FaHome },
                { path: '/menu', label: 'Menu', icon: FaUtensils },
            ];
        }

        const role = user?.role || user?.staffRole;

        switch (role) {
            case 'Customer':
                return [
                    { path: '/', label: 'Home', icon: FaHome },
                    { path: '/menu', label: 'Menu', icon: FaUtensils },
                    { path: '/orders', label: 'My Orders', icon: FaClipboardList },
                    { path: '/feedback', label: 'Feedback', icon: FaComments },
                    { path: '/profile', label: 'Profile', icon: FaUser },
                ];

            case 'Admin':
                return [
                    { path: '/admin', label: 'Dashboard', icon: FaTachometerAlt },
                    { path: '/admin/orders', label: 'Orders', icon: FaClipboardList },
                    { path: '/admin/customers', label: 'Customers', icon: FaUsers },
                    { path: '/admin/staff', label: 'Staff', icon: FaUserTie },
                    { path: '/admin/menu', label: 'Menu', icon: FaUtensils },
                    { path: '/admin/addons', label: 'Add-ons', icon: FaTags },
                    { path: '/admin/analytics', label: 'Analytics', icon: FaChartLine },
                    { path: '/delivery/map', label: 'Live Delivery Map', icon: FaMapMarkedAlt },
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
                    { path: '/delivery/active', label: 'Deliveries', icon: FaClipboardList },
                    { path: '/delivery/map', label: 'Map', icon: FaHome },
                ];

            default:
                return [{ path: '/', label: 'Home', icon: FaHome }];
        }
    };

    const navigationItems = getNavigationItems();

    return (
        <header className="bg-white/95 backdrop-blur border-b border-gray-200/80 shadow-sm sticky top-0 z-30 dark:bg-slate-900/95 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Sidebar Controls */}
                    <div className="flex items-center space-x-2">
                        {showSidebarToggle && (
                            <>
                                <button
                                    type="button"
                                    onClick={onToggleMobileSidebar}
                                    className="lg:hidden p-2 text-gray-700 hover:text-primary-700 hover:bg-gray-100 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-primary-400 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900"
                                    aria-label={isMobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                                    title={isMobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                                >
                                    {isMobileSidebarOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
                                </button>

                                <button
                                    type="button"
                                    onClick={onToggleSidebar}
                                    className="hidden lg:inline-flex p-2 text-gray-700 hover:text-primary-700 hover:bg-gray-100 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-primary-400 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900"
                                    aria-label={isSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
                                    title={isSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
                                >
                                    {isSidebarVisible ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
                                </button>
                            </>
                        )}

                        <Link to="/" className="flex items-center space-x-2 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-sm flex items-center justify-center">
                                <span className="text-white font-bold text-xl">{(publicSettings.restaurantName || 'V').charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 hidden sm:block dark:text-slate-100 truncate">
                                {publicSettings.restaurantName || 'OrderFlow'}
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    {/* These links are based on getNavigationItems() and current logged-in role. */}
                    <nav className={`${showSidebarToggle ? 'hidden' : 'hidden md:flex'} space-x-1 rounded-xl bg-slate-50/80 p-1 border border-slate-200/80 dark:bg-slate-800/80 dark:border-slate-700`}>
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    aria-current={isActive(item.path) ? 'page' : undefined}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 ${isActive(item.path)
                                        ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-primary-400'
                                        : 'text-gray-700 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-700/80'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {/* Dark mode toggle */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-2 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900 transition-colors"
                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDark
                                ? <FaSun className="w-4 h-4" />
                                : <FaMoon className="w-4 h-4" />
                            }
                        </button>

                        {shouldShowCart && (
                            <Link
                                to="/cart"
                                className="relative rounded-xl p-2 text-gray-700 hover:text-primary-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-primary-400 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900"
                                title="View cart"
                            >
                                <FaShoppingCart className="w-6 h-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[11px] rounded-full w-5 h-5 flex items-center justify-center font-semibold ring-2 ring-white dark:ring-slate-900">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {isAuthenticated && (
                            <>
                                {/* Bell icon and popup list for app notifications */}
                                <NotificationCenter />

                                <div className="flex items-center space-x-3">
                                    <div className="hidden sm:block text-right bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:bg-slate-800 dark:border-slate-700">
                                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{user?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{user?.role || user?.staffRole}</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-red-400 dark:hover:bg-red-950/30 dark:focus-visible:ring-offset-slate-900"
                                        title="Logout"
                                    >
                                        <FaSignOutAlt className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        )}

                        {!isAuthenticated && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Link
                                    to="/login"
                                    className="text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 whitespace-nowrap px-2 py-1 rounded-lg hover:bg-slate-100 dark:text-slate-300 dark:hover:text-primary-400 dark:hover:bg-slate-800"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="hidden sm:inline-flex bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 shadow-sm whitespace-nowrap"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation */}
                {!showSidebarToggle && (
                    <nav className="md:hidden pb-4 flex flex-wrap gap-2">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    aria-current={isActive(item.path) ? 'page' : undefined}
                                    className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-1 border transition-colors ${isActive(item.path)
                                        ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-400'
                                        : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon className="w-3 h-3" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>
        </header>
    );
};

export default Header;
