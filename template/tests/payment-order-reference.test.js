import test from "node:test";
import assert from "node:assert/strict";
import { getPaymentOrderReference } from "../src/app/lib/services/common_urls/payment-reference.js";

test("prefers paypal order id when both order and subscription ids exist", () => {
  assert.equal(
    getPaymentOrderReference({
      paypalOrderId: "PP-ORDER-123",
      paypalSubscriptionId: "I-SUB-456",
    }),
    "PP-ORDER-123",
  );
});

test("falls back to subscription id when order id is missing", () => {
  assert.equal(
    getPaymentOrderReference({
      paypalOrderId: null,
      paypalSubscriptionId: "I-SUB-456",
    }),
    "I-SUB-456",
  );
});
