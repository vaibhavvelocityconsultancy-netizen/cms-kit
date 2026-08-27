// app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
// import { apiMutations } from "@/src/lib/apiMutations";
import { fetchers } from "@/src/lib/fetchers";
import { authApi } from "@/src/lib/auth";
import { SiteSettings } from "../Cms";
import { SettingsPage } from "../SettingsPage";
import { apiMutations } from "@/src/lib/apimutation";

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await fetchers.settings({ t: Date.now() });

      console.log("FETCH SETTINGS:", data);

      setSettings(data.data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newSettings: Partial<SiteSettings>) => {
    const updated = await apiMutations.updateSettings(newSettings);

    if (!updated.success) {
      throw new Error(updated.message || "Failed to save settings");
    }

    setSettings(updated.data);
  };

  // ✅ Only ONE handleUpload function, defined inside the component
  const handleUpload = async (file: File): Promise<string> => {
    console.log("handleUpload called with file:", file.name);

    const formData = new FormData();
    formData.append("file", file);

    const response = await authApi.uploadFile(formData);

    if (!response.success) {
      throw new Error(response.message || "Upload failed");
    }

    const result = response;
    console.log("Upload response:", result);

    // Fix: Access the nested data.url
    return result.data.url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SettingsPage
      initialSettings={settings || undefined}
      onSave={handleSave}
      onUpload={handleUpload}
    />
  );
}
