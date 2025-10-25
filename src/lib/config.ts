// Stable API base URL without proxying
const raw = (import.meta.env.VITE_API_BASE as string | undefined) || "https://ledgerwise-fullstack-code.onrender.com";
export const API_BASE = raw.replace(/\/+$/g, "");
export const apiUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
