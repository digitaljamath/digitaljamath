/**
 * Configuration utilities for Vite React frontend.
 * Uses import.meta.env for environment variables (Vite convention).
 */

/**
 * Get the API base URL for making requests to the backend.
 * In development, Vite proxies /api to the Django backend.
 * In production, we use the same origin.
 */
export function getApiBaseUrl(): string {
    // In Vite, we use the proxy configured in vite.config.ts
    // So API calls should just use relative paths like '/api/...'
    return ''
}

export function getLandingPageUrl(): string {
    // If we're on the local Vite dev server, redirect back to the local Nginx proxy
    if (window.location.port === '5173' || window.location.port === '5174') {
        return 'http://127.0.0.1/'
    }
    // In production, Nginx serves the root / as the Django landing page
    return '/'
}

export const APP_VERSION = '1.0.0';

/**
 * Get the domain suffix for tenant registration.
 */
export function getDomainSuffix(): string {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'localhost'
    }
    const parts = hostname.split('.')
    if (parts.length >= 2) {
        return parts.slice(-2).join('.')
    }
    return hostname
}

/**
 * Check if we're running in development mode.
 */
export function isDevelopment(): boolean {
    return import.meta.env.DEV
}

/**
 * Check if we're running in production mode.
 */
export function isProduction(): boolean {
    return import.meta.env.PROD
}
