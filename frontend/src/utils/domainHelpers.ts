export const getCustomDomain = () => {
    const hostname = window.location.hostname;
    // Special handling for localhost
    if (hostname.endsWith('localhost')) {
        return 'localhost';
    }
    const parts = hostname.split('.');
    // Return base domain (e.g., digitaljamath.com)
    if (parts.length >= 2) {
        return parts.slice(-2).join('.');
    }
    return hostname;
};

export const getSubdomainLink = (subdomain?: string, path?: string) => {
    const url = getSubdomainUrl(subdomain);
    return `${url}${path ?? ''}`;
};

export function getSubdomainUrl(subdomain?: string) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Determine the root domain (removing any current subdomain)
    let rootDomain = hostname;
    const parts = hostname.split('.');

    // localhost logic: localhost or sub.localhost
    if (hostname.endsWith('localhost')) {
        rootDomain = 'localhost';
    } else if (parts.length > 2) {
        // e.g. demo.digitaljamath.com -> digitaljamath.com
        rootDomain = parts.slice(-2).join('.');
    }

    const portSuffix = port ? ':' + port : '';
    // If a subdomain is provided, prepend it. Otherwise, return the root domain.
    const newHostname = subdomain ? `${subdomain}.${rootDomain}` : rootDomain;

    return `${protocol}//${newHostname}${portSuffix}`;
}

export function redirectToSubdomain(subdomain: string) {
    const url = getSubdomainUrl(subdomain);
    window.location.href = url;
}