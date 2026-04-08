import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCart } from '../../utils/cartStorage';
import {
    FaHome,
    FaUtensils,
    FaShoppingCart,
    FaClipboardList,
    FaUser,
    FaComments,
    FaBell,
    FaSignOutAlt,
    FaTachometerAlt,
    FaUsers,
    FaUserTie,
    FaChartLine,
    FaBoxes,
} from 'react-icons/fa';

const Header = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const [cartCount, setCartCount] = useState(0);
    const userRole = user?.role || user?.staffRole;
    const shouldShowCart = !isAuthenticated || userRole === 'Customer';

    // Load cart count on mount and listen for updates
    useEffect(() => {
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

    const isActive = (path) => location.pathname === path;

    // Navigation items based on user role
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
                    { path: '/admin/analytics', label: 'Analytics', icon: FaChartLine },
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
                    { path: '/delivery/active', label: 'Deliveries', icon: FaClipboardList },
                    { path: '/delivery/map', label: 'Map', icon: FaHome },
                ];

            default:
                return [{ path: '/', label: 'Home', icon: FaHome }];
        }
    };

    const navigationItems = getNavigationItems();

    return (
        <header className="bg-white shadow-sm sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">V</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900 hidden sm:block">
                            Voleena Foods
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-1">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${isActive(item.path)
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        {shouldShowCart && (
                            <Link
                                to="/cart"
                                className="relative text-gray-700 hover:text-primary-600"
                                title="View cart"
                            >
                                <FaShoppingCart className="w-6 h-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {isAuthenticated && (
                            <>
                                <button
                                    onClick={() => alert('Notifications feature coming soon!')}
                                    className="relative text-gray-700 hover:text-primary-600"
                                    title="Notifications"
                                >
                                    <FaBell className="w-6 h-6" />
                                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        0
                                    </span>
                                </button>

                                <div className="flex items-center space-x-3">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                        <p className="text-xs text-gray-500">{user?.role || user?.staffRole}</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="text-gray-700 hover:text-red-600 p-2"
                                        title="Logout"
                                    >
                                        <FaSignOutAlt className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        )}

                        {!isAuthenticated && (
                            <div className="flex items-center space-x-2">
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-gray-700 hover:text-primary-600"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="md:hidden pb-4 flex flex-wrap gap-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-3 py-2 rounded-md text-xs font-medium flex items-center space-x-1 ${isActive(item.path)
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-700 bg-gray-100'
                                    }`}
                            >
                                <Icon className="w-3 h-3" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
};

export default Header;
