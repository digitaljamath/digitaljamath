export const getApiBaseUrl = () => {
    if (typeof window === 'undefined') return ''; // Server-side

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    // If we have an environment variable, use it (Production build time)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // If localhost, use port 8000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:8000`;
    }

    // For production (e.g., digitaljamath.com), the API is on the same domain/port via Nginx /api/
    // But our frontend code expects the ROOT URL (e.g. https://digitaljamath.com)
    // and appends /api/ endpoint. 
    // Since Nginx proxies /api/ to backend, we can just use the current origin.
    return window.location.origin;
};

/**
 * Get the domain suffix for workspace domains.
 * Configurable via NEXT_PUBLIC_DOMAIN_SUFFIX environment variable.
 * Falls back to current hostname for self-hosted deployments.
 */
export const getDomainSuffix = () => {
    // Allow override via environment variable
    if (process.env.NEXT_PUBLIC_DOMAIN_SUFFIX) {
        return process.env.NEXT_PUBLIC_DOMAIN_SUFFIX;
    }

    if (typeof window === 'undefined') return 'localhost';

    const hostname = window.location.hostname;

    // For localhost, just show "localhost"
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'localhost';
    }

    // For production, use the current domain
    return hostname;
};

/**
 * Get the base domain for redirect checks (main domain without subdomain)
 */
export const getBaseDomain = () => {
    if (process.env.NEXT_PUBLIC_BASE_DOMAIN) {
        return process.env.NEXT_PUBLIC_BASE_DOMAIN;
    }

    if (typeof window === 'undefined') return 'localhost';

    return window.location.hostname;
};

/**
 * Get the application version
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.4-alpha';
