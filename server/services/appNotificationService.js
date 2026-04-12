const { AppNotification, Staff, Role } = require('../models');

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 30;

const toRecipientType = (userType) => userType === 'Customer' ? 'CUSTOMER' : 'STAFF';

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

const normalizePriority = (priority = 'MEDIUM') => {
    const normalized = String(priority || 'MEDIUM').trim().toUpperCase();
    return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(normalized) ? normalized : 'MEDIUM';
};

class AppNotificationService {
    buildRecipientFromUser(user) {
        return {
            recipientType: toRecipientType(user.type),
            recipientId: user.id,
            recipientRole: toRecipientRole(user)
        };
    }

    async listForUser(user, options = {}) {
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

    async countUnreadForUser(user) {
        const recipient = this.buildRecipientFromUser(user);

        return AppNotification.count({
            where: {
                RecipientType: recipient.recipientType,
                RecipientID: recipient.recipientId,
                IsRead: false
            }
        });
    }

    async markAsReadForUser(user, notificationId) {
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

    async markAllAsReadForUser(user) {
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

    async notifyUser(user, payload) {
        const recipient = this.buildRecipientFromUser(user);

        return this.createNotification({
            ...payload,
            recipientType: recipient.recipientType,
            recipientId: recipient.recipientId,
            recipientRole: recipient.recipientRole
        });
    }

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

    async notifyStaffRoles(roleNames, payload) {
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

        await Promise.all(staffMembers.map((staff) => this.createNotification({
            ...payload,
            recipientType: 'STAFF',
            recipientId: staff.StaffID,
            recipientRole: String(staff.role?.RoleName || 'STAFF').toUpperCase()
        })));

        return staffMembers.length;
    }
}

module.exports = new AppNotificationService();