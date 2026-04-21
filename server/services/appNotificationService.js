// CODEMAP: BACKEND_SERVICE_APPNOTIFICATIONSERVICE
// PURPOSE: Contains business logic and interacts with databases or external APIs.
// SEARCH_HINT: Look here for core business logic and data access patterns.
let AppNotification;
let Staff;
let Role;

try {
    ({ AppNotification, Staff, Role } = require('../models'));
} catch (error) {
    if (process.env.NODE_ENV !== 'test') {
        console.warn('[APP_NOTIFICATION] Models unavailable at startup:', error.message);
    }
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 30;

// Simple: This handles to recipient type logic.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const toRecipientType = (userType) => userType === 'Customer' ? 'CUSTOMER' : 'STAFF';

// Simple: This handles to recipient role logic.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const toRecipientRole = (user) => {
    if (!user) {
        return null;
    }

    if (user.type === 'Customer') {
        return 'CUSTOMER';
    }

    if (typeof user.role === 'string' && user.role.trim()) {
        return user.role.trim().toUpperCase();
    }

    return 'STAFF';
};

// Simple: This cleans or formats the priority.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const normalizePriority = (priority = 'MEDIUM') => {
    const normalized = String(priority || 'MEDIUM').trim().toUpperCase();
    return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(normalized) ? normalized : 'MEDIUM';
};

// This keeps in-app notification actions in one place.
class AppNotificationService {
    // This prepares the person who should receive a notification.
    buildRecipientFromUser(user) {
        return {
            recipientType: toRecipientType(user.type),
            recipientId: user.id,
            recipientRole: toRecipientRole(user)
        };
    }

    // This gets notifications for one user.
    async listForUser(user, options = {}) {
        if (!AppNotification) {
            return {
                total: 0,
                limit: DEFAULT_LIMIT,
                offset: 0,
                items: []
            };
        }

        const recipient = this.buildRecipientFromUser(user);
        const limit = Math.min(Math.max(Number.parseInt(options.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
        const offset = Math.max(Number.parseInt(options.offset, 10) || 0, 0);
        const unreadOnly = options.unreadOnly === true;

        const where = {
            RecipientType: recipient.recipientType,
            RecipientID: recipient.recipientId
        };

        if (unreadOnly) {
            where.IsRead = false;
        }

        const { count, rows } = await AppNotification.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        return {
            total: count,
            limit,
            offset,
            items: rows
        };
    }

    // This counts unread notifications for one user.
    async countUnreadForUser(user) {
        if (!AppNotification) {
            return 0;
        }

        const recipient = this.buildRecipientFromUser(user);

        return AppNotification.count({
            where: {
                RecipientType: recipient.recipientType,
                RecipientID: recipient.recipientId,
                IsRead: false
            }
        });
    }

    // This marks one notification as read.
    async markAsReadForUser(user, notificationId) {
        if (!AppNotification) {
            return false;
        }

        const recipient = this.buildRecipientFromUser(user);

        const [updated] = await AppNotification.update({
            IsRead: true,
            ReadAt: new Date()
        }, {
            where: {
                AppNotificationID: notificationId,
                RecipientType: recipient.recipientType,
                RecipientID: recipient.recipientId,
                IsRead: false
            }
        });

        return updated > 0;
    }

    // This marks all notifications as read for one user.
    async markAllAsReadForUser(user) {
        if (!AppNotification) {
            return 0;
        }

        const recipient = this.buildRecipientFromUser(user);

        const [updated] = await AppNotification.update({
            IsRead: true,
            ReadAt: new Date()
        }, {
            where: {
                RecipientType: recipient.recipientType,
                RecipientID: recipient.recipientId,
                IsRead: false
            }
        });

        return updated;
    }

    // This deletes one notification for one user.
    async deleteOneForUser(user, notificationId) {
        if (!AppNotification) {
            return false;
        }

        const recipient = this.buildRecipientFromUser(user);

        const deleted = await AppNotification.destroy({
            where: {
                AppNotificationID: notificationId,
                RecipientType: recipient.recipientType,
                RecipientID: recipient.recipientId
            }
        });

        return deleted > 0;
    }

    // This deletes all notifications for one user.
    async clearAllForUser(user) {
        if (!AppNotification) {
            return 0;
        }

        const recipient = this.buildRecipientFromUser(user);

        return AppNotification.destroy({
            where: {
                RecipientType: recipient.recipientType,
                RecipientID: recipient.recipientId
            }
        });
    }

    async createNotification({
        recipientType,
        recipientId,
        recipientRole = null,
        eventType,
        title,
        message,
        payload = null,
        priority = 'MEDIUM',
        relatedOrderId = null,
        dedupeKey = null
    }) {
        if (!AppNotification) {
            return null;
        }

        const normalizedRecipientType = String(recipientType || '').trim().toUpperCase();
        const normalizedRecipientId = Number.parseInt(recipientId, 10);
        const normalizedRecipientRole = recipientRole ? String(recipientRole).trim().toUpperCase() : null;

        if (!['CUSTOMER', 'STAFF'].includes(normalizedRecipientType) || !Number.isInteger(normalizedRecipientId)) {
            return null;
        }

        if (!eventType || !title || !message) {
            return null;
        }

        const safeDedupeKey = dedupeKey ? String(dedupeKey).trim().slice(0, 191) : null;

        try {
            return await AppNotification.create({
                RecipientType: normalizedRecipientType,
                RecipientID: normalizedRecipientId,
                RecipientRole: normalizedRecipientRole,
                EventType: String(eventType).trim().slice(0, 64),
                Title: String(title).trim().slice(0, 255),
                Message: String(message).trim(),
                PayloadJSON: payload,
                Priority: normalizePriority(priority),
                RelatedOrderID: Number.isInteger(Number.parseInt(relatedOrderId, 10)) ? relatedOrderId : null,
                DedupeKey: safeDedupeKey || null
            });
        } catch (error) {
            if (error?.name === 'SequelizeUniqueConstraintError' && safeDedupeKey) {
                return null;
            }

            console.error('Failed to create app notification:', error.message);
            return null;
        }
    }

    // This sends a notification to one user.
    async notifyUser(user, payload) {
        const recipient = this.buildRecipientFromUser(user);

        return this.createNotification({
            ...payload,
            recipientType: recipient.recipientType,
            recipientId: recipient.recipientId,
            recipientRole: recipient.recipientRole
        });
    }

    // This sends a notification to one customer.
    async notifyCustomer(customerId, payload) {
        const normalizedCustomerId = Number.parseInt(customerId, 10);
        if (!Number.isInteger(normalizedCustomerId)) {
            return null;
        }

        return this.createNotification({
            ...payload,
            recipientType: 'CUSTOMER',
            recipientId: normalizedCustomerId,
            recipientRole: 'CUSTOMER'
        });
    }

    // This sends a notification to one staff member.
    async notifyStaffById(staffId, payload) {
        const normalizedStaffId = Number.parseInt(staffId, 10);
        if (!Number.isInteger(normalizedStaffId)) {
            return null;
        }

        return this.createNotification({
            ...payload,
            recipientType: 'STAFF',
            recipientId: normalizedStaffId
        });
    }

    // This sends a notification to staff with matching roles.
    async notifyStaffRoles(roleNames, payload) {
        if (!Staff || !Role) {
            return 0;
        }

        const normalizedRoles = [...new Set((Array.isArray(roleNames) ? roleNames : [roleNames])
            .map((roleName) => String(roleName || '').trim())
            .filter(Boolean))];

        if (normalizedRoles.length === 0) {
            return 0;
        }

        const staffMembers = await Staff.findAll({
            attributes: ['StaffID'],
            where: { IsActive: true },
            include: [{
                model: Role,
                as: 'role',
                attributes: ['RoleName'],
                where: {
                    RoleName: normalizedRoles
                }
            }]
        });

        const baseDedupeKey = payload?.dedupeKey ? String(payload.dedupeKey).trim() : null;

        await Promise.all(staffMembers.map((staff) => this.createNotification({
            ...payload,
            recipientType: 'STAFF',
            recipientId: staff.StaffID,
            recipientRole: String(staff.role?.RoleName || 'STAFF').toUpperCase(),
            dedupeKey: baseDedupeKey ? `${baseDedupeKey}:${staff.StaffID}`.slice(0, 191) : null
        })));

        return staffMembers.length;
    }
}

module.exports = new AppNotificationService();
