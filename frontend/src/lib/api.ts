/**
 * API utilities for making authenticated requests with Token Refresh support.
 */

import { getApiBaseUrl } from './config'

interface TokenResponse {
    access: string;
    refresh?: string;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

/**
 * Make an authenticated fetch request.
 * Automatically handles 401 errors by attempting to refresh the token.
 */
/**
 * Make an authenticated fetch request.
 * Automatically handles 401 errors by attempting to refresh the token.
 */
export async function fetchWithAuth(
    url: string,
    options: RequestInit = {},
    tokenType: 'staff' | 'portal' = 'staff'
): Promise<Response> {
    const apiBase = getApiBaseUrl();
    const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`;

    // Helper to constructing headers
    const getHeaders = (token: string | null) => {
        const headers = new Headers(options.headers || {});
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }
        return headers;
    };

    const storageKey = tokenType === 'staff' ? 'access_token' : 'portal_access_token';
    const refreshKey = tokenType === 'staff' ? 'refresh_token' : 'portal_refresh_token';

    let token = localStorage.getItem(storageKey);

    // 1. Initial Attempt
    let response = await fetch(fullUrl, {
        ...options,
        headers: getHeaders(token),
    });

    // 2. Handle 401 (Unauthorized)
    if (response.status === 401) {
        // Simplified Logic: Try refresh, if success retry, else logout
        const refreshed = await attemptRefreshToken(tokenType);
        if (refreshed) {
            token = localStorage.getItem(storageKey);
            return fetch(fullUrl, {
                ...options,
                headers: getHeaders(token),
            });
        } else {
            if (tokenType === 'staff') {
                logout();
            } else {
                logoutPortal();
            }
            return response;
        }
    }

    return response;
}

/**
 * Attempt to refresh the access token using the refresh token.
 */
async function attemptRefreshToken(tokenType: 'staff' | 'portal' = 'staff'): Promise<boolean> {
    const storageKey = tokenType === 'staff' ? 'access_token' : 'portal_access_token';
    const refreshKey = tokenType === 'staff' ? 'refresh_token' : 'portal_refresh_token';

    const refreshToken = localStorage.getItem(refreshKey);
    if (!refreshToken) return false;

    const apiBase = getApiBaseUrl();
    try {
        const response = await fetch(`${apiBase}/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
            const data: TokenResponse = await response.json();
            localStorage.setItem(storageKey, data.access);
            // Some APIs rotate refresh tokens too
            if (data.refresh) {
                localStorage.setItem(refreshKey, data.refresh);
            }
            return true;
        }
    } catch (error) {
        console.error("Token refresh failed", error);
    }
    return false;
}

/**
 * Portal Logout
 */
export function logoutPortal(): void {
    localStorage.removeItem('portal_access_token');
    localStorage.removeItem('portal_refresh_token');
    localStorage.removeItem('portal_household_id');
    localStorage.removeItem('portal_membership_id');
    localStorage.removeItem('portal_head_name');
    window.location.href = '/portal/login';
}

/**
 * Login and store tokens.
 */
export async function login(email: string, password: string): Promise<boolean> {
    const apiBase = getApiBaseUrl()
    try {
        const response = await fetch(`${apiBase}/api/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password }),
        })

        if (!response.ok) {
            return false
        }

        const data = await response.json()
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        return true
    } catch (e) {
        return false;
    }
}

/**
 * Logout and clear tokens.
 */
export function logout(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    // Dispatch event so UI can react?
    window.location.href = '/auth/signin';
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
}
