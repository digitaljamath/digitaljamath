/** SPA is at /jamath in production; Vite serves / in local dev. */
export const ROUTER_BASENAME = import.meta.env.PROD ? "/jamath" : "/";
