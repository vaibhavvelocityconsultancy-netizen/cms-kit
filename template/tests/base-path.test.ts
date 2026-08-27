import test from "node:test";
import assert from "node:assert/strict";
import { getAppBasePath, resolveAppUrl } from "../src/lib/base-path.ts";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalWindow = (globalThis as any).window;

test("detects the deployment base path from NEXT_PUBLIC_SITE_URL", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://ipdav.com/newweb";
  delete (globalThis as any).window;

  assert.equal(getAppBasePath(), "/newweb");
});

test("builds absolute URLs that include the detected base path", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://ipdav.com";
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { pathname: "/newweb/subscription" } },
  });

  assert.equal(
    resolveAppUrl("/api/media/42", "https://ipdav.com"),
    "https://ipdav.com/api/media/42",
  );
});

test("builds absolute API URLs when the app is mounted under a base path", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://ipdav.com/newweb";
  delete (globalThis as any).window;

  assert.equal(
    resolveAppUrl("/api/public/pages/slug/home", "https://ipdav.com"),
    "https://ipdav.com/newweb/api/public/pages/slug/home",
  );
});

test.afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }

  if (originalWindow === undefined) {
    delete (globalThis as any).window;
  } else {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});
