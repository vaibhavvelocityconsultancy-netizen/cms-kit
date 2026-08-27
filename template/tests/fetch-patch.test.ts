import test from "node:test";
import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;
const originalWindow = (globalThis as any).window;
const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalPatched = (globalThis as any).__ipdavFetchPatched;

test("prefixes /api requests with the detected base path", async () => {
  const requests: string[] = [];

  (globalThis as any).__ipdavFetchPatched = false;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { pathname: "/newweb/subscription" } },
  });
  delete process.env.NEXT_PUBLIC_SITE_URL;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requests.push(String(input));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  await import("../src/lib/fetch-patch.ts");
  await fetch("/api/subscription");

  assert.deepEqual(requests, ["/newweb/api/subscription"]);
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) {
    delete (globalThis as any).window;
  } else {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
  (globalThis as any).__ipdavFetchPatched = originalPatched;
});
