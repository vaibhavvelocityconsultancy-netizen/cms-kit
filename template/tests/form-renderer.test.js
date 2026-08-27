import test from "node:test";
import assert from "node:assert/strict";

import { injectForms } from "../src/lib/form-renderer.ts";

test("injectForms replaces form shortcodes with rendered HTML", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input) => {
    assert.match(String(input), /\/api\/form\/slug\/contact-us$/);

    return new Response(
      JSON.stringify({
        data: {
          id: "1",
          title: "Contact",
          slug: "contact-us",
          status: "active",
          fields: [
            {
              id: "name",
              type: "text",
              name: "name",
              label: "Name",
              required: true,
            },
          ],
          submitButtonLabel: "Send",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const result = await injectForms('<p>[form slug="contact-us"]</p>');

    assert.equal(result.hasForms, true);
    assert.match(result.html, /cms-form-wrap/);
    assert.match(result.html, /data-form-slug="contact-us"/);
    assert.match(result.html, /Send/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
