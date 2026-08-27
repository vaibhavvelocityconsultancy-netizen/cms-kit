export function resolveFileDownloadUrl(
  fileUrl,
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL,
) {
  if (!fileUrl) return fileUrl;

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  if (fileUrl.startsWith("//")) {
    return `https:${fileUrl}`;
  }

  const resolvedBaseUrl = baseUrl || "http://localhost:3000";
  return new URL(fileUrl, resolvedBaseUrl).toString();
}
