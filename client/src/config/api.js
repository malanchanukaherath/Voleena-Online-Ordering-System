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
