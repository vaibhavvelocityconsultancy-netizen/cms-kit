// app/admin/[tenantSlug]/image-seo/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/ui/button";
import { Switch } from "@/src/ui/switch";
import { getBaseUrl } from "@/src/lib/config";

export default function ImageSeoPage({ params }) {
  const [settings, setSettings] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("settings"); // 'settings' | 'media' | 'batch'

  useEffect(() => {
    fetchSettings();
    fetchMedia();
  }, [params.tenantSlug]);

  async function fetchSettings() {
    const res = await fetch(
      `${getBaseUrl()}/api/admin/image-seo/settings?tenant=${params.tenantSlug}`,
    );
    const data = await res.json();
    setSettings(data);
  }

  async function fetchMedia() {
    const res = await fetch(
      `${getBaseUrl()}/api/admin/image-seo/media?tenant=${params.tenantSlug}`,
    );
    const data = await res.json();
    setMedia(data);
    setLoading(false);
  }

  async function updateSettings(updates) {
    const res = await fetch(`${getBaseUrl()}/api/admin/image-seo/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        ...updates,
        tenantSlug: params.tenantSlug,
      }),
    });
    const updated = await res.json();
    setSettings(updated);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Image SEO Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {["settings", "media", "batch"].map((tabName) => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`px-4 py-2 font-medium ${
              tab === tabName
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500"
            }`}
          >
            {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
          </button>
        ))}
      </div>

      {/* SETTINGS TAB */}
      {tab === "settings" && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              Auto Generation Settings
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-medium">Enable Auto Generation</label>
                <Switch
                  checked={settings?.enableAutoGeneration}
                  onCheckedChange={(checked) =>
                    updateSettings({ enableAutoGeneration: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="font-medium">
                  Use Page Title as Fallback
                </label>
                <Switch
                  checked={settings?.usePageTitle}
                  onCheckedChange={(checked) =>
                    updateSettings({ usePageTitle: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="font-medium">Use Image Filename</label>
                <Switch
                  checked={settings?.useImageFilename}
                  onCheckedChange={(checked) =>
                    updateSettings({ useImageFilename: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="font-medium">Use Image Description</label>
                <Switch
                  checked={settings?.useImageDescription}
                  onCheckedChange={(checked) =>
                    updateSettings({ useImageDescription: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA TAB - View all media with alt/title */}
      {tab === "media" && (
        <div className="space-y-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Total media: {media.length} | Missing alt:{" "}
              {media.filter((m) => !m.altText).length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-2 text-left">Image</th>
                  <th className="px-4 py-2 text-left">Alt Text</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {media.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <img
                        src={m.url}
                        alt=""
                        className="w-10 h-10 object-cover"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        defaultValue={m.altText || ""}
                        className="w-full px-2 py-1 border rounded"
                        placeholder="Add alt text..."
                        onBlur={(e) => updateMediaAlt(m.id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        defaultValue={m.title || ""}
                        className="w-full px-2 py-1 border rounded"
                        placeholder="Add title..."
                        onBlur={(e) => updateMediaTitle(m.id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          m.altText && m.title
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {m.altText && m.title ? "✓ Complete" : "⚠ Incomplete"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BATCH TAB - Regenerate missing alt/title */}
      {tab === "batch" && (
        <div className="bg-white p-6 rounded-lg border max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Batch Operations</h2>

          <div className="space-y-4">
            <p className="text-gray-600">
              Found {media.filter((m) => !m.altText).length} images without alt
              text
            </p>

            <Button
              onClick={() => generateMissingAltText()}
              className="bg-blue-600"
            >
              Generate Missing Alt Text
            </Button>

            <Button onClick={() => regenerateAllAltText()} variant="outline">
              Regenerate All Alt Text
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  async function updateMediaAlt(mediaId, altText) {
    await fetch(`${getBaseUrl()}/api/admin/image-seo/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altText }),
    });
    fetchMedia();
  }

  async function updateMediaTitle(mediaId, title) {
    await fetch(`${getBaseUrl()}/api/admin/image-seo/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    fetchMedia();
  }

  async function generateMissingAltText() {
    const res = await fetch(
      `${getBaseUrl()}/api/admin/image-seo/batch-generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: params.tenantSlug,
          type: "missing",
        }),
      },
    );
    const result = await res.json();
    alert(`Generated alt text for ${result.count} images`);
    fetchMedia();
  }

  async function regenerateAllAltText() {
    if (!confirm("This will regenerate alt text for ALL images. Continue?"))
      return;

    const res = await fetch(
      `${getBaseUrl()}/api/admin/image-seo/batch-generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: params.tenantSlug,
          type: "all",
        }),
      },
    );
    const result = await res.json();
    alert(`Regenerated alt text for ${result.count} images`);
    fetchMedia();
  }
}
