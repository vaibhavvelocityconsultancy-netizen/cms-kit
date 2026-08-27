// src/lib/fetch-patch.ts
// Patches the global fetch so any relative "/api/..." call automatically
// gets prefixed with the app's basePath (e.g. "/newweb") when running
// in the browser or current runtime. This avoids having to rewrite every
// fetch("/api/...") call across the codebase when deployed under a subpath.

if (
  typeof globalThis.fetch === "function" &&
  !(globalThis as any).__ipdavFetchPatched
) {
  const originalFetch = globalThis.fetch;

  const getBasePath = () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (siteUrl) {
      try {
        const url = new URL(siteUrl);
        return url.pathname.replace(/\/$/, "");
      } catch {
        return "";
      }
    }

    if (typeof window !== "undefined") {
      const pathname = window.location.pathname.replace(/\/$/, "");
      if (!pathname || pathname === "/") return "";

      const knownBasePaths = ["/newweb", "/cms", "/app"];
      const matchedBasePath = knownBasePaths.find(
        (basePath) =>
          pathname === basePath || pathname.startsWith(`${basePath}/`),
      );

      return matchedBasePath ?? "";
    }

    return "";
  };

  const patchedFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const basePath = getBasePath();

    const shouldPrefix = (target: string) =>
      basePath &&
      target.startsWith("/api") &&
      !target.startsWith(`${basePath}/api`);

    if (typeof input === "string") {
      if (shouldPrefix(input)) {
        input = `${basePath}${input}`;
      }
    } else if (input instanceof URL) {
      const pathname = input.pathname;
      if (shouldPrefix(pathname)) {
        input = new URL(`${basePath}${pathname}${input.search}`, input.origin);
      }
    } else if (input instanceof Request) {
      const requestUrl = new URL(input.url);
      if (shouldPrefix(requestUrl.pathname)) {
        const prefixedUrl = new URL(
          `${basePath}${requestUrl.pathname}${requestUrl.search}`,
          requestUrl.origin,
        );
        input = new Request(prefixedUrl, input);
      }
    }

    return originalFetch(input, init);
  }) as typeof globalThis.fetch;

  (globalThis as any).__ipdavFetchPatched = true;
  globalThis.fetch = patchedFetch;
}
