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