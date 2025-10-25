// Normalize trailing slash and export a stable API base URL
const raw = (import.meta.env.VITE_API_BASE as string | undefined) || "http://localhost:5000";
export const API_BASE = raw.replace(/\/+$/g, "");

export const apiUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
