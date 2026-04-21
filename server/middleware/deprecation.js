/**
 * Deprecation Warning Middleware
 * Logs warnings when deprecated APIs are used
 * Remove in version 3.0
 */

const deprecationWarnings = new Map();

// Simple: This handles deprecation middleware logic.
// Frontend connection: Applies shared security/validation rules across customer and staff flows.
function deprecationMiddleware(newPath) {
  return (req, res, next) => {
    const key = `${req.method}:${req.path}`;
    
    // Log warning once per route per session
    if (!deprecationWarnings.has(key)) {
      deprecationWarnings.set(key, true);
      console.warn(`⚠️ DEPRECATED API USED: ${req.method} ${req.path}`);
      console.warn(`   Please update to: ${req.method} /api/v1${newPath}`);
      console.warn(`   Scheduled for removal in v3.0 (2026-06-01)`);
    }

    // Add deprecation header
    res.set('Deprecation', 'true');
    res.set('Sunset', 'Sun, 01 Jun 2026 00:00:00 GMT');
    res.set('Link', `</api/v1${newPath}>; rel="successor-version"`);
    
    next();
  };
}

module.exports = deprecationMiddleware;

