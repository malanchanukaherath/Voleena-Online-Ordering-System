// CODEMAP: BACKEND_CONTROLLER_NOTIFICATIONCONTROLLER
// PURPOSE: Handles incoming requests, processes logic, and returns responses.
// SEARCH_HINT: Look here for request handling logic and data processing.
const appNotificationService = require('../services/appNotificationService');

const parseBoolean = (value) => {
    if (typeof value === 'boolean') {
        return value;
    }

    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
};

exports.getMyNotifications = async (req, res) => {
    try {
        const result = await appNotificationService.listForUser(req.user, {
            limit: req.query.limit,
            offset: req.query.offset,
            unreadOnly: parseBoolean(req.query.unreadOnly)
        });

        return res.json({
            success: true,
            data: result.items,
            pagination: {
                total: result.total,
                limit: result.limit,
                offset: result.offset
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications'
        });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await appNotificationService.countUnreadForUser(req.user);

        return res.json({
            success: true,
            data: {
                unreadCount
            }
        });
    } catch (error) {
        console.error('Get unread notification count error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch unread count'
        });
    }
};

exports.markOneAsRead = async (req, res) => {
    try {
        const notificationId = Number.parseInt(req.params.id, 10);

        if (!Number.isInteger(notificationId) || notificationId <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid notification id'
            });
        }

        const updated = await appNotificationService.markAsReadForUser(req.user, notificationId);

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        return res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update notification'
        });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const updatedCount = await appNotificationService.markAllAsReadForUser(req.user);

        return res.json({
            success: true,
            data: {
                updatedCount
            }
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update notifications'
        });
    }
};

exports.deleteOne = async (req, res) => {
    try {
        const notificationId = Number.parseInt(req.params.id, 10);

        if (!Number.isInteger(notificationId) || notificationId <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid notification id'
            });
        }

        const deleted = await appNotificationService.deleteOneForUser(req.user, notificationId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        return res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete notification'
        });
    }
};

exports.clearAll = async (req, res) => {
    try {
        const deletedCount = await appNotificationService.clearAllForUser(req.user);

        return res.json({
            success: true,
            data: {
                deletedCount
            }
        });
    } catch (error) {
        console.error('Clear notifications error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to clear notifications'
        });
    }
};
