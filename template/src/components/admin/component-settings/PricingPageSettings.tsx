"use client";

import { getBaseUrl } from "@/src/lib/config";
import { useEffect, useState } from "react";

interface FormItem {
  id: number;
  title: string;
  slug: string;
  status: string;
}

interface PricingSettings {
  formId: number | null;
  form?: FormItem | null;
}

export default function PricingPageSettings() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [formId, setFormId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load forms + current pricing setting
  useEffect(() => {
    async function load() {
      try {
        const [formsRes, settingsRes] = await Promise.all([
          fetch(`${getBaseUrl()}/api/form`),
          fetch(`${getBaseUrl()}/api/pricing-page-settings`),
        ]);

        const formsData = await formsRes.json();
        const settingsData = await settingsRes.json();

        if (formsData.success) {
          setForms(formsData.data || []);
        }

        if (settingsData.success && settingsData.data) {
          setFormId(
            settingsData.data.formId
              ? String(settingsData.data.formId)
              : "",
          );
        }
      } catch (error) {
        console.error("Failed to load pricing settings", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `${getBaseUrl()}/api/pricing-page-settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formId: formId ? Number(formId) : null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save settings",
        );
      }

      setMessage("Pricing page settings saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Loading pricing settings...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold">
          Pricing Page
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Choose the form displayed on the Pricing page.
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-xl">
          <label
            htmlFor="pricing-form"
            className="mb-2 block text-sm font-medium"
          >
            Form
          </label>

          <select
            id="pricing-form"
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">
              No form
            </option>

            {forms.map((form) => (
              <option
                key={form.id}
                value={form.id}
              >
                {form.title}
              </option>
            ))}
          </select>

          {formId && (
            <p className="mt-2 text-xs text-muted-foreground">
              This form will be displayed on the Pricing page.
            </p>
          )}

          {/* Message */}
          {message && (
            <p className="mt-4 text-sm">
              {message}
            </p>
          )}

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-5 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}