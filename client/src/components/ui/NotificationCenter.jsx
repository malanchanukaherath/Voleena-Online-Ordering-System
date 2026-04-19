import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import Button from './Button';
import Card from './Card';
import Modal from './Modal';
import { FaBell } from 'react-icons/fa';

// Code Review: Function NotificationCenter in client\src\components\ui\NotificationCenter.jsx. Used in: client/src/components/layout/Header.jsx, client/src/components/ui/NotificationCenter.jsx.
const NotificationCenter = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  // Code Review: Function formatTime in client\src\components\ui\NotificationCenter.jsx. Used in: client/src/components/ui/NotificationCenter.jsx, client/src/pages/ResetPassword.jsx, client/src/pages/VerifyAccount.jsx.
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Code Review: Function getPriorityColor in client\src\components\ui\NotificationCenter.jsx. Used in: client/src/components/ui/NotificationCenter.jsx.
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-blue-500';
    }
  };

  // Code Review: Function getTypeIcon in client\src\components\ui\NotificationCenter.jsx. Used in: client/src/components/ui/NotificationCenter.jsx.
  const getTypeIcon = (type) => {
    switch (type) {
      case 'order_update':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z" />
          </svg>
        );
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md dark:text-slate-300 dark:hover:text-primary-400"
        title="Notifications"
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Notifications"
        size="lg"
      >
        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              {/* demo buttons removed per request */}
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (clearAll) clearAll();
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {(!notifications || notifications.length === 0) ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z" />
              </svg>
              <p className="text-gray-500 dark:text-slate-400">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.filter(n => n && n.id).map((notification) => (
                <Card
                  key={notification.id}
                  className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`flex-shrink-0 mt-1 ${
                        notification.read ? 'text-gray-400' : 'text-primary-600'
                      }`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${
                          notification.read ? 'text-gray-600 dark:text-slate-400' : 'text-gray-900 dark:text-slate-100'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 dark:text-slate-400">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 dark:text-slate-500">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead && markAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      <button
                        onClick={() => removeNotification && removeNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default NotificationCenter;
