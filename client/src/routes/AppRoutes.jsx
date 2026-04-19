// CODEMAP: FRONTEND_ROUTE_MAP
// PURPOSE: Map URL paths to pages and protect routes by role.
// SEARCH_HINT: Review this file to explain user/staff navigation flow.
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { PublicRoute } from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Home from '../pages/Home';
import Menu from '../pages/Menu';
import MenuItemDetail from '../pages/MenuItemDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import OrderConfirmation from '../pages/OrderConfirmation';
import OrderHistory from '../pages/OrderHistory';
import OrderTracking from '../pages/OrderTracking';
import Profile from '../pages/Profile';
import Feedback from '../pages/Feedback';
import AdminDashboard from '../pages/AdminDashboard';
import OrderManagement from '../pages/OrderManagement';
import CustomerManagement from '../pages/CustomerManagement';
import StaffManagement from '../pages/StaffManagement';
import MenuManagement from '../pages/MenuManagement';
import AddOnManagement from '../pages/AddOnManagement';
import CategoryManagement from '../pages/CategoryManagement';
import ComboManagement from '../pages/ComboManagement';
import StockManagement from '../pages/StockManagement';
import FeedbackManagement from '../pages/FeedbackManagement';
import SalesAnalytics from '../pages/SalesAnalytics';
import Settings from '../pages/Settings';
import CashierDashboard from '../pages/CashierDashboard';
import CashierOrders from '../pages/CashierOrders';
import CustomerRegistration from '../pages/CustomerRegistration';
import KitchenDashboard from '../pages/KitchenDashboard';
import KitchenOrders from '../pages/KitchenOrders';
import DeliveryDashboard from '../pages/DeliveryDashboard';
import ActiveDeliveries from '../pages/ActiveDeliveries';
import DeliveryMap from '../pages/DeliveryMap';
import StaticPage from '../pages/StaticPage';

// Code Review: Function AppRoutes in client\src\routes\AppRoutes.jsx. Used in: client/src/App.jsx, client/src/components/ProtectedRoute.jsx, client/src/main.jsx.
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/menu/:itemId" element={<MenuItemDetail />} />
      <Route path="/menu/:itemType/:itemId" element={<MenuItemDetail />} />
      <Route path="/about" element={<StaticPage page="about" />} />
      <Route path="/contact" element={<StaticPage page="contact" />} />
      <Route path="/privacy" element={<StaticPage page="privacy" />} />
      <Route path="/terms" element={<StaticPage page="terms" />} />

      {/* Auth Routes - redirect if already logged in */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Customer Protected Routes */}
      <Route path="/cart" element={<Cart />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-confirmation/:orderId"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <OrderConfirmation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <OrderHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId/track"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <OrderTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <Feedback />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['Admin']}><OrderManagement /></ProtectedRoute>} />
      <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['Admin']}><CustomerManagement /></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['Admin']}><StaffManagement /></ProtectedRoute>} />
      <Route path="/admin/menu" element={<ProtectedRoute allowedRoles={['Admin']}><MenuManagement /></ProtectedRoute>} />
      <Route path="/admin/addons" element={<ProtectedRoute allowedRoles={['Admin']}><AddOnManagement /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['Admin']}><CategoryManagement /></ProtectedRoute>} />
      <Route path="/admin/combos" element={<ProtectedRoute allowedRoles={['Admin']}><ComboManagement /></ProtectedRoute>} />
      <Route path="/admin/stock" element={<ProtectedRoute allowedRoles={['Admin']}><StockManagement /></ProtectedRoute>} />
      <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={['Admin']}><FeedbackManagement /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['Admin']}><SalesAnalytics /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['Admin']}><Settings /></ProtectedRoute>} />

      {/* Cashier Protected Routes */}
      <Route path="/cashier/dashboard" element={<ProtectedRoute allowedRoles={['Cashier', 'Admin']}><CashierDashboard /></ProtectedRoute>} />
      <Route path="/cashier/pos" element={<ProtectedRoute allowedRoles={['Cashier', 'Admin']}><CashierDashboard posOnly /></ProtectedRoute>} />
      <Route path="/cashier" element={<Navigate to="/cashier/dashboard" replace />} />
      <Route path="/cashier/orders" element={<ProtectedRoute allowedRoles={['Cashier', 'Admin']}><CashierOrders /></ProtectedRoute>} />
      <Route path="/cashier/customers/new" element={<ProtectedRoute allowedRoles={['Cashier', 'Admin']}><CustomerRegistration /></ProtectedRoute>} />

      {/* Kitchen Protected Routes */}
      <Route path="/kitchen/dashboard" element={<ProtectedRoute allowedRoles={['Kitchen', 'Admin']}><KitchenDashboard /></ProtectedRoute>} />
      <Route path="/kitchen" element={<Navigate to="/kitchen/dashboard" replace />} />
      <Route path="/kitchen/orders" element={<ProtectedRoute allowedRoles={['Kitchen', 'Admin']}><KitchenOrders /></ProtectedRoute>} />
      <Route path="/kitchen/stock" element={<ProtectedRoute allowedRoles={['Kitchen', 'Admin']}><StockManagement /></ProtectedRoute>} />

      {/* Delivery Protected Routes */}
      <Route path="/delivery/dashboard" element={<ProtectedRoute allowedRoles={['Delivery', 'Admin']}><DeliveryDashboard /></ProtectedRoute>} />
      <Route path="/delivery" element={<Navigate to="/delivery/dashboard" replace />} />
      <Route path="/delivery/active" element={<ProtectedRoute allowedRoles={['Delivery', 'Admin']}><ActiveDeliveries /></ProtectedRoute>} />
      <Route path="/delivery/map" element={<ProtectedRoute allowedRoles={['Delivery', 'Admin']}><DeliveryMap /></ProtectedRoute>} />

      {/* Catch all 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Page not found</p>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go to Home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;

