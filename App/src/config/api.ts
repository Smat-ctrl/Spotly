const rawApiUrl = import.meta.env.VITE_API_URL?.trim() || "";

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

export function apiUrl(path: string) {
  if (!path.startsWith("/")) {
    throw new Error("API paths must start with '/'.");
  }

  return `${API_BASE_URL}${path}`;
}
