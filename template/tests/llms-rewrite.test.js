import test from "node:test";
import assert from "node:assert/strict";
import nextConfig from "../next.config.mjs";

test("rewrites markdown preview paths to the public llms API", async () => {
  const rewrites = await nextConfig.rewrites();

  assert.ok(Array.isArray(rewrites));
  assert.ok(
    rewrites.some(
      (rule) =>
        rule.source === "/:slug(.+).md" &&
        rule.destination === "/api/public/llms/:slug",
    ),
  );
});
