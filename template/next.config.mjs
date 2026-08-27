/** @type {import('next').NextConfig} */

function getBasePath() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return "";
  try {
    const path = new URL(siteUrl).pathname.replace(/\/$/, "");
    return path === "" ? "" : path;
  } catch {
    return "";
  }
}

const basePath = getBasePath();

const nextConfig = {
  output: "standalone",

  basePath: basePath,
  assetPrefix: basePath || undefined,

  async rewrites() {
    return [
      {
        source: "/:slug(.+).md",
        destination: "/api/public/llms/:slug",
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
