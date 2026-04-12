/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import backendApi from '../services/backendApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30000;

const toUiNotification = (item) => ({
  id: item?.AppNotificationID,
  title: item?.Title || 'Notification',
  message: item?.Message || '',
  timestamp: item?.created_at || item?.createdAt || new Date().toISOString(),
  type: String(item?.EventType || 'GENERAL').toLowerCase(),
  priority: String(item?.Priority || 'MEDIUM').toLowerCase(),
  read: Boolean(item?.IsRead),
  relatedOrderId: item?.RelatedOrderID || null,
  payload: item?.PayloadJSON || null
});

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [lastCleared, setLastCleared] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dismissedIdsRef = useRef(dismissedIds);

  useEffect(() => {
    dismissedIdsRef.current = dismissedIds;
  }, [dismissedIds]);

  const syncNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const [listResponse, unreadResponse] = await Promise.all([
        backendApi.get('/api/v1/notifications', {
          params: {
            limit: 50,
            offset: 0
          }
        }),
        backendApi.get('/api/v1/notifications/unread-count')
      ]);

      const list = Array.isArray(listResponse?.data?.data) ? listResponse.data.data : [];
      const mapped = list
        .map(toUiNotification)
        .filter((notification) => notification?.id)
        .filter((notification) => !dismissedIdsRef.current.includes(notification.id));

      setNotifications(mapped);

      const count = Number.parseInt(unreadResponse?.data?.data?.unreadCount, 10);
      setUnreadCount(Number.isInteger(count) && count >= 0
        ? count
        : mapped.filter((notification) => !notification.read).length);
    } catch (error) {
      console.error('Failed to sync notifications:', error?.response?.data || error.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setLastCleared([]);
      setDismissedIds([]);
      return;
    }

    syncNotifications();
    const intervalId = setInterval(syncNotifications, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, syncNotifications]);

  const markAsRead = useCallback(async (id) => {
    let changed = false;

    setNotifications((current) => current.map((notification) => {
      if (notification.id === id && !notification.read) {
        changed = true;
        return { ...notification, read: true };
      }

      return notification;
    }));

    if (changed) {
      setUnreadCount((current) => Math.max(current - 1, 0));
    }

    try {
      await backendApi.patch(`/api/v1/notifications/${id}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error?.response?.data || error.message);
      await syncNotifications();
    }
  }, [syncNotifications]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) => current.map((notification) => ({
      ...notification,
      read: true
    })));
    setUnreadCount(0);

    try {
      await backendApi.patch('/api/v1/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error?.response?.data || error.message);
      await syncNotifications();
    }
  }, [syncNotifications]);

  const removeNotification = useCallback((id) => {
    setNotifications((current) => {
      const target = current.find((notification) => notification.id === id);
      if (target && !target.read) {
        setUnreadCount((count) => Math.max(count - 1, 0));
      }

      return current.filter((notification) => notification.id !== id);
    });

    setDismissedIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications((current) => {
      setLastCleared(current);
      setDismissedIds((dismissed) => {
        const currentIds = current.map((notification) => notification.id).filter(Boolean);
        return Array.from(new Set([...dismissed, ...currentIds]));
      });
      return [];
    });
    setUnreadCount(0);

    try {
      await backendApi.patch('/api/v1/notifications/read-all');
    } catch (error) {
      console.error('Failed to clear notifications:', error?.response?.data || error.message);
      await syncNotifications();
    }
  }, [syncNotifications]);

  const undoClear = useCallback(() => {
    const idsToRestore = lastCleared.map((notification) => notification.id);

    setDismissedIds((current) => current.filter((id) => !idsToRestore.includes(id)));
    setNotifications((current) => (current.length > 0 ? current : lastCleared));
    setUnreadCount((current) => {
      if (lastCleared.length === 0) {
        return current;
      }

      const restoredUnread = lastCleared.filter((notification) => !notification.read).length;
      return Math.max(current, restoredUnread);
    });
    setLastCleared([]);
  }, [lastCleared]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    syncNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    undoClear
  }), [
    notifications,
    unreadCount,
    syncNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    undoClear
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
};
