import test from "node:test";
import assert from "node:assert/strict";
import { resolveFileDownloadUrl } from "../src/app/lib/utils/fileDownloadUrl.js";

test("resolveFileDownloadUrl turns relative public paths into absolute URLs", () => {
  const url = resolveFileDownloadUrl(
    "/uploads/subscriber-files/tenant-1/frame-142-38b3ec1241fa.png",
    "https://example.com",
  );
  assert.equal(
    url,
    "https://example.com/uploads/subscriber-files/tenant-1/frame-142-38b3ec1241fa.png",
  );
});

test("resolveFileDownloadUrl leaves absolute URLs unchanged", () => {
  const remoteUrl = "https://cdn.example.com/file.pdf";
  assert.equal(
    resolveFileDownloadUrl(remoteUrl, "https://example.com"),
    remoteUrl,
  );
});
