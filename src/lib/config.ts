export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export const apiUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
