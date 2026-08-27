// src/lib/config.ts

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function getBaseUrl() {
  // Server
  if (typeof window === "undefined") {
    return SITE_URL.replace(/\/$/, "");
  }

  // Client
  try {
    const url = new URL(SITE_URL);
    return url.pathname.replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    return `${getBaseUrl()}${normalizedPath}`;
  }

  const site = new URL(SITE_URL);
  const basePath = site.pathname.replace(/\/$/, "");
  return `${site.origin}${basePath}${normalizedPath}`;
}
