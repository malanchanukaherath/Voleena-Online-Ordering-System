const { ActivityLog } = require('../models');

// CODEMAP: BACKEND_SERVER_UTILS_AUDITLOGGER_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { ActivityLog } = require('../models');

// CODEMAP: BACKEND_SERVER_UTILS_AUDITLOGGER_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { ActivityLog } = require('../models');

// CODEMAP: BACKEND_SERVER_UTILS_AUDITLOGGER_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { ActivityLog } = require('../models');
};
// CODEMAP: BACKEND_SERVER_UTILS_AUDITLOGGER_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { ActivityLog } = require('../models');

/**
 * Log activity to the activity_log table
 * @param {Object} params - Activity log parameters
 * @param {string} params.userType - 'STAFF' or 'CUSTOMER'
 * @param {number} params.userId - User ID
 * @param {string} params.action - Action performed (e.g., 'CREATE_CUSTOMER')
 * @param {string} params.entityType - Entity type (e.g., 'Customer', 'Staff')
 * @param {number} params.entityId - Entity ID
 * @param {Object} params.details - Additional details (will be JSON stringified)
 * @param {string} params.ipAddress - IP address
 * @param {string} params.userAgent - User agent string
 */
// Simple: This sends or records the activity.
async function logActivity({
    userType,
    userId,
    action,
    entityType = null,
    entityId = null,
    details = {},
    ipAddress = null,
    userAgent = null
}) {
    try {
        await ActivityLog.create({
            UserType: userType,
            UserID: userId,
            Action: action,
            EntityType: entityType,
            EntityID: entityId,
            Details: JSON.stringify(details),
            IPAddress: ipAddress,
            UserAgent: userAgent
        });
    } catch (error) {
        console.error('Audit log error:', error.message);
        // Don't throw - logging failure shouldn't break the main operation
    }
}

/**
 * Extract IP address from request
 */
// Simple: This gets the client ip.
function getClientIP(req) {
    return req.ip ||
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.connection.remoteAddress ||
        'unknown';
}

/**
 * Log customer creation
 */
// Simple: This sends or records the customer creation.
async function logCustomerCreation(req, customer, isNew = true) {
    await logActivity({
        userType: 'STAFF',
        userId: req.user.id,
        action: isNew ? 'CREATE_CUSTOMER' : 'CUSTOMER_ALREADY_EXISTS',
        entityType: 'Customer',
        entityId: customer.CustomerID,
        details: {
            customerName: customer.Name,
            phone: customer.Phone,
            email: customer.Email,
            createdBy: req.user.name,
            isNew
        },
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent']
    });
}

/**
 * Log staff creation
 */
// Simple: This sends or records the staff creation.
async function logStaffCreation(req, staff, roleName, isNew = true) {
    await logActivity({
        userType: 'STAFF',
        userId: req.user.id,
        action: isNew ? 'CREATE_STAFF' : 'STAFF_ALREADY_EXISTS',
        entityType: 'Staff',
        entityId: staff.StaffID,
        details: {
            staffName: staff.Name,
            email: staff.Email,
            role: roleName,
            createdBy: req.user.name,
            isNew
        },
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent']
    });
}

module.exports = {
    logActivity,
    getClientIP,
    logCustomerCreation,
    logStaffCreation
};



