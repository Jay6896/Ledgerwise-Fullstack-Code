// Normalize trailing slash and export a stable API base URL
// Prefer same-origin proxy on Vercel to avoid third-party cookie blocking
let raw = (import.meta.env.VITE_API_BASE as string | undefined);

if (!raw) {
  if (typeof window !== 'undefined' && /\.vercel\.app$/.test(window.location.hostname)) {
    raw = '/api';
  } else {
    raw = 'https://ledgerwise-fullstack-code.onrender.com';
  }
}

export const API_BASE = raw.replace(/\/+$/g, "");
export const apiUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
