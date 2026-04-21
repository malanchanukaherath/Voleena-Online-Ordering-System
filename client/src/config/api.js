// CODEMAP: FRONTEND_CONFIG_API_JS
// WHAT_THIS_IS: This file supports frontend behavior for api.js.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: config/api.js
// - Search text: api.js
const resolvedBaseUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '/';

export const API_BASE_URL = resolvedBaseUrl.replace(/\/+$/, '');
export const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;

// Simple: This cleans or formats the asset url.
export const resolveAssetUrl = (assetPath) => {
    if (!assetPath) {
        return null;
    }
    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
        return assetPath;
    }
    return `${API_BASE_URL}${assetPath}`;
};

