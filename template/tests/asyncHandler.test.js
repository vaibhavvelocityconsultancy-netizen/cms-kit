import test from "node:test";
import assert from "node:assert/strict";
import { asyncHandler } from "../src/app/lib/utils/asyncHandler.js";

test("asyncHandler maps Prisma unique constraint errors to a 409 response", async () => {
  const handler = asyncHandler(async () => {
    const error = new Error("Unique constraint failed on the fields: (slug)");
    error.code = "P2002";
    error.meta = { target: ["slug"] };
    throw error;
  });

  const response = await handler();
  assert.equal(response.status, 409);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.match(body.message, /already exists/i);
});
