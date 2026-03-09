/**
 * Audit Logging Middleware
 * Logs all state-changing operations (POST, PUT, PATCH, DELETE) to activity_log table
 * Helps with security audit trail and compliance
 */

const { ActivityLog } = require('../models');

const auditLogMiddleware = async (req, res, next) => {
  // Only log state-changing operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Store original send function
  const originalSend = res.send;

  // Override send to capture response status
  res.send = function(data) {
    res.send = originalSend; // restore original send

    // Only log successful operations (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      logActivity(req, res).catch(err => {
        console.error('Audit logging error:', err);
      });
    }

    return res.send(data);
  };

  next();
};

async function logActivity(req, res) {
  try {
    // Extract entity type and ID from route
    const pathParts = req.path.split('/').filter(p => p);
    let entityType = pathParts[pathParts.length - 2] || 'unknown';
    let entityId = null;

    // Try to parse entity ID from URL
    const lastPart = pathParts[pathParts.length - 1];
    if (!isNaN(lastPart)) {
      entityId = parseInt(lastPart);
    }

    // Determine action from HTTP method
    let action = 'UNKNOWN';
    switch (req.method) {
      case 'POST':
        action = 'CREATE';
        break;
      case 'PUT':
      case 'PATCH':
        action = 'UPDATE';
        break;
      case 'DELETE':
        action = 'DELETE';
        break;
    }

    // Create audit log entry
    if (ActivityLog) {
      await ActivityLog.create({
        user_type: req.user.type,
        user_id: req.user.id,
        action: action,
        entity_type: entityType,
        entity_id: entityId,
        details: JSON.stringify({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent')
      });
    }
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - we don't want logging to break the request
  }
}

module.exports = auditLogMiddleware;

