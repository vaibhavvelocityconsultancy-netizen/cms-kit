export function getAppBasePath() {
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
}

export function appUrl(path: string) {
  const basePath = getAppBasePath();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!basePath) return normalizedPath;

  if (normalizedPath.startsWith(`${basePath}/`) || normalizedPath === basePath) {
    return normalizedPath; // already prefixed, avoid double-prefix
  }

  return `${basePath}${normalizedPath}`;
}

export function resolveAppUrl(path: string, fallbackOrigin = "") {
  const basePath = getAppBasePath();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!basePath) {
    if (!fallbackOrigin) return normalizedPath;
    return new URL(normalizedPath, fallbackOrigin).toString();
  }

  if (
    normalizedPath.startsWith(`${basePath}/`) ||
    normalizedPath === basePath
  ) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("/api")) {
    if (fallbackOrigin) {
      return new URL(`${basePath}${normalizedPath}`, fallbackOrigin).toString();
    }
    return `${basePath}${normalizedPath}`;
  }

  if (fallbackOrigin) {
    return new URL(`${basePath}${normalizedPath}`, fallbackOrigin).toString();
  }

  return `${basePath}${normalizedPath}`;
}
