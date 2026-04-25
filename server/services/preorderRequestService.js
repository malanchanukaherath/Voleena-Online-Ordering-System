const { Op, Transaction } = require('sequelize');
const {
    sequelize,
    Customer,
    Staff,
    Order,
    MenuItem,
    ComboPack,
    PreorderRequest,
    PreorderRequestItem
} = require('../models');

const REQUESTABLE_STATUSES = new Set(['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED']);
const PHONE_REGEX = /^[+]?[0-9]{9,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const includeDefinition = [
    {
        model: Customer,
        as: 'customer',
        attributes: ['CustomerID', 'Name', 'Email', 'Phone']
    },
    {
        model: Staff,
        as: 'approver',
        attributes: ['StaffID', 'Name', 'Email'],
        required: false
    },
    {
        model: Staff,
        as: 'rejector',
        attributes: ['StaffID', 'Name', 'Email'],
        required: false
    },
    {
        model: Order,
        as: 'linkedOrder',
        attributes: ['OrderID', 'OrderNumber', 'Status'],
        required: false
    },
    {
        model: PreorderRequestItem,
        as: 'items',
        required: false,
        include: [
            {
                model: MenuItem,
                as: 'menuItem',
                attributes: ['MenuItemID', 'Name'],
                required: false
            },
            {
                model: ComboPack,
                as: 'combo',
                attributes: ['ComboID', 'Name'],
                required: false
            }
        ]
    }
];

const normalizePhone = (phone) => String(phone || '').replace(/\s/g, '');

const normalizeItems = (items = []) => {
    return (Array.isArray(items) ? items : [])
        .map((item) => ({
            menuItemId: item?.menuItemId ? Number.parseInt(item.menuItemId, 10) : null,
            comboId: item?.comboId ? Number.parseInt(item.comboId, 10) : null,
            requestedName: String(item?.requestedName || '').trim() || null,
            quantity: Number.parseInt(item?.quantity, 10) || 0,
            notes: String(item?.notes || '').trim() || null
        }))
        .filter((item) => (item.menuItemId || item.comboId || item.requestedName) && item.quantity > 0);
};

class PreorderRequestService {
    async generateRequestNumber(transaction) {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const count = await PreorderRequest.count({
            where: {
                created_at: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            },
            transaction
        });

        const year = now.getFullYear().toString().slice(-2);
        const month = `${now.getMonth() + 1}`.padStart(2, '0');
        const day = `${now.getDate()}`.padStart(2, '0');
        const sequence = `${count + 1}`.padStart(4, '0');

        return `PRE${year}${month}${day}${sequence}`;
    }

    async createRequest(customerId, payload) {
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
        });

        try {
            const customer = await Customer.findByPk(customerId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!customer || !customer.IsActive || customer.AccountStatus !== 'ACTIVE') {
                throw new Error('Customer account is not active');
            }

            const contactName = String(payload.contactName || customer.Name || '').trim();
            const contactPhone = normalizePhone(payload.contactPhone || customer.Phone || '');
            const contactEmail = String(payload.contactEmail || customer.Email || '').trim();
            const requestDetails = String(payload.requestDetails || '').trim();
            const requestedFor = payload.requestedFor ? new Date(payload.requestedFor) : null;
            const items = normalizeItems(payload.items);

            if (!contactName) {
                throw new Error('Contact name is required');
            }

            if (!PHONE_REGEX.test(contactPhone)) {
                throw new Error('A valid contact phone number is required');
            }

            if (!EMAIL_REGEX.test(contactEmail)) {
                throw new Error('A valid contact email is required');
            }

            if (!requestDetails) {
                throw new Error('Request details are required');
            }

            if (!requestedFor || Number.isNaN(requestedFor.getTime())) {
                throw new Error('Requested date/time is required');
            }

            if (requestedFor.getTime() < Date.now() + (15 * 60 * 1000)) {
                throw new Error('Requested date/time must be at least 15 minutes in the future');
            }

            for (const item of items) {
                if (item.menuItemId) {
                    const menuItem = await MenuItem.findByPk(item.menuItemId, {
                        transaction
                    });
                    if (!menuItem) {
                        throw new Error(`Menu item ${item.menuItemId} was not found`);
                    }
                    if (!item.requestedName) {
                        item.requestedName = menuItem.Name;
                    }
                }

                if (item.comboId) {
                    const combo = await ComboPack.findByPk(item.comboId, {
                        transaction
                    });
                    if (!combo) {
                        throw new Error(`Combo pack ${item.comboId} was not found`);
                    }
                    if (!item.requestedName) {
                        item.requestedName = combo.Name;
                    }
                }
            }

            const requestNumber = await this.generateRequestNumber(transaction);

            const preorderRequest = await PreorderRequest.create({
                RequestNumber: requestNumber,
                CustomerID: customerId,
                ContactName: contactName,
                ContactPhone: contactPhone,
                ContactEmail: contactEmail,
                RequestedFor: requestedFor,
                RequestDetails: requestDetails,
                Status: 'SUBMITTED'
            }, { transaction });

            if (items.length > 0) {
                await PreorderRequestItem.bulkCreate(items.map((item) => ({
                    PreorderRequestID: preorderRequest.PreorderRequestID,
                    MenuItemID: item.menuItemId,
                    ComboID: item.comboId,
                    RequestedName: item.requestedName,
                    Quantity: item.quantity,
                    Notes: item.notes
                })), { transaction });
            }

            await transaction.commit();

            return this.getRequestById(preorderRequest.PreorderRequestID);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async listRequests({ user, status, limit = 100, offset = 0 }) {
        const where = {};
        if (status) {
            where.Status = String(status).trim().toUpperCase();
        }

        if (user.type === 'Customer') {
            where.CustomerID = user.id;
        }

        return PreorderRequest.findAll({
            where,
            include: includeDefinition,
            order: [
                ['requested_for', 'ASC'],
                ['created_at', 'DESC']
            ],
            limit,
            offset
        });
    }

    async getRequestById(id) {
        return PreorderRequest.findByPk(id, {
            include: includeDefinition
        });
    }

    async updateStatus(id, { status, adminNotes, rejectedReason }, staffId) {
        const normalizedStatus = String(status || '').trim().toUpperCase();
        if (!REQUESTABLE_STATUSES.has(normalizedStatus) || normalizedStatus === 'SUBMITTED') {
            throw new Error('Unsupported preorder request status');
        }

        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
        });

        try {
            const request = await PreorderRequest.findByPk(id, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!request) {
                throw new Error('Preorder request not found');
            }

            if (request.Status === 'CANCELLED') {
                throw new Error('Cancelled preorder requests cannot be changed');
            }

            if (request.Status === 'REJECTED' && normalizedStatus !== 'CANCELLED') {
                throw new Error('Rejected preorder requests cannot be changed');
            }

            if (request.Status === 'APPROVED' && normalizedStatus === 'REJECTED') {
                throw new Error('Approved preorder requests cannot be rejected');
            }

            if (normalizedStatus === 'REJECTED' && !String(rejectedReason || '').trim()) {
                throw new Error('Rejected reason is required');
            }

            request.Status = normalizedStatus;
            request.AdminNotes = String(adminNotes || '').trim() || request.AdminNotes || null;

            if (normalizedStatus === 'APPROVED') {
                request.ApprovedBy = staffId;
                request.ApprovedAt = new Date();
                request.RejectedBy = null;
                request.RejectedAt = null;
                request.RejectedReason = null;
            }

            if (normalizedStatus === 'REJECTED') {
                request.RejectedBy = staffId;
                request.RejectedAt = new Date();
                request.RejectedReason = String(rejectedReason || '').trim();
            }

            await request.save({ transaction });
            await transaction.commit();

            return this.getRequestById(request.PreorderRequestID);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new PreorderRequestService();
