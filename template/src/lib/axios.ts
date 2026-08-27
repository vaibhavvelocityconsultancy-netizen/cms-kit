import axios from "axios";
import { resolveAppUrl } from "./base-path";

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return resolveAppUrl("", window.location.origin);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      return (
        new URL(siteUrl).origin + new URL(siteUrl).pathname.replace(/\/$/, "")
      );
    } catch {
      return "";
    }
  }

  return "";
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error.response?.data;

    const enhancedError = new Error(
      payload?.message || payload?.error || error.message || "Request failed",
    ) as any;

    enhancedError.status = error.response?.status;
    enhancedError.response = error.response;
    enhancedError.data = payload;

    return Promise.reject(enhancedError);
  },
);

// Export helper for fetch() if needed
export { getApiBaseUrl };
