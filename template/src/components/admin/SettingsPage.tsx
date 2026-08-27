"use client";

import { useState, useRef, useEffect } from "react";
import {
  Save,
  Globe,
  Settings as SettingsIcon,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Wrench,
} from "lucide-react";
import { Button } from "@/src/ui/button";
import { MediaPickerModal } from "../media-manager/MediaPicker";
import { Page } from "./Cms";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Label } from "@/src/ui/label";
import { Switch } from "@/src/ui/switch";
import { Input } from "@/src/ui/input";
import { fetchers } from "@/src/lib/fetchers";

// ─── Image Upload Component (Simplified - No URL input) ─────────────────────

interface ImageUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  onUpload?: (file: File) => Promise<string>;
}

function ImageUpload({ label, value, onChange, onUpload }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      if (onUpload) {
        const url = await onUpload(file);
        onChange(url);
      } else {
        // Fallback to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview Card */}
      {value && (
        <div className="relative flex items-center gap-3 border rounded-lg p-3 bg-card w-fit min-w-70">
          <img
            src={value}
            alt={label}
            className="w-16 h-16 rounded object-cover border"
          />

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{value.split("/").pop()}</p>

            <p className="text-xs text-muted-foreground">{label}</p>
          </div>

          <button
            type="button"
            onClick={() => onChange("")}
            className="text-muted-foreground hover:text-destructive"
          >
            ✕
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowMediaPicker(true)}
        >
          {value ? `Change ${label}` : `Select ${label}`}
        </Button>

        {value && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onChange("")}
          >
            Remove {label}
          </Button>
        )}
      </div>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media: any) => {
          onChange(media.url);
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
}

// ─── Main Settings Component ─────────────────────────────────────────────────

interface SiteSettings {
  id: number;
  siteName: string | null;
  siteTagline: string | null;
  logo: string | null;
  favicon: string | null;
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
  postsPerPage: number;

  homepageType: "posts" | "page";
  homepagePageId: number | null;
  postsPageId: number | null;
  showAdminToolbar: boolean;

  // Module toggles (UI-only for now)
  coursesEnabled: boolean;
  seoEnabled: boolean;
  ecommerceEnabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

interface SettingsPageProps {
  initialSettings?: Partial<SiteSettings>;
  onSave: (settings: Partial<SiteSettings>) => Promise<void>;
  onUpload?: (file: File) => Promise<string>;
  isSaving?: boolean;
}

export function SettingsPage({
  initialSettings,
  onSave,
  onUpload,
  isSaving = false,
}: SettingsPageProps) {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({
    siteName: "",
    siteTagline: "",
    logo: "",
    favicon: "",
    defaultMetaTitle: "",
    defaultMetaDescription: "",
    postsPerPage: 10,
    showAdminToolbar: true,
    coursesEnabled: false,
    seoEnabled: false,
    ecommerceEnabled: false,
    ...initialSettings,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [pages, setPages] = useState([]);

  useEffect(() => {
    const fetchPages = async () => {
      const data = await fetchers.pages();
      setPages(data.data);
    };
    fetchPages();
  }, []);

  useEffect(() => {
    if (initialSettings) {
      setSettings({
        siteName: "",
        siteTagline: "",
        logo: "",
        favicon: "",
        defaultMetaTitle: "",
        defaultMetaDescription: "",
        postsPerPage: 10,
        showAdminToolbar: true,
        coursesEnabled: false,
        seoEnabled: false,
        ecommerceEnabled: false,
        ...initialSettings,
      });

      setHasChanges(false);
    }
  }, [initialSettings]);
  const updateField = <K extends keyof SiteSettings>(
    field: K,
    value: SiteSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setSaveStatus("saving");
    try {
      await onSave(settings);
      setSaveStatus("success");
      setHasChanges(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Site Settings
            </h1>
          </div>
          <p className="text-muted-foreground">
            Configure your site&apos;s global settings, SEO defaults, and
            appearance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* General Settings */}
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  General Settings
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  name="siteName"
                  value={settings.siteName || ""}
                  onChange={(e) => updateField("siteName", e.target.value)}
                  placeholder="My Awesome Site"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Site Tagline
                </label>
                <input
                  type="text"
                  name="siteTagline"
                  value={settings.siteTagline || ""}
                  onChange={(e) => updateField("siteTagline", e.target.value)}
                  placeholder="A great place to share knowledge"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <ImageUpload
                label="Site Logo"
                value={settings.logo || null}
                onChange={(url) => updateField("logo", url || "")}
                onUpload={onUpload}
              />

              <ImageUpload
                label="Site Icon"
                value={settings.favicon || null}
                onChange={(url) => updateField("favicon", url || "")}
                onUpload={onUpload}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Posts Per Page
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="postsPerPage"
                    value={settings.postsPerPage}
                    onChange={(e) =>
                      updateField(
                        "postsPerPage",
                        parseInt(e.target.value) || 10,
                      )
                    }
                    min={1}
                    max={100}
                    className="w-32 border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-muted-foreground">
                    posts per page
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Admin Preview Toolbar
                </h2>
              </div>
            </div>
            <div className="p-6">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <span className="block text-sm font-medium text-foreground">
                    Show Admin Toolbar on Preview
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Displays Edit Page and Customize CSS actions on public
                    iframe previews for admins.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showAdminToolbar !== false}
                  onChange={(e) =>
                    updateField("showAdminToolbar", e.target.checked)
                  }
                  className="h-5 w-5 accent-primary"
                />
              </label>
            </div>
          </div>

          {/* ── Modules ─────────────────────────────────────── */}
          <div
            className="border border-border rounded-lg bg-card overflow-hidden"
            data-testid="modules-settings-section"
          >
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Modules
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Turn optional CMS modules on or off. Changes take effect
                immediately after saving.
              </p>
            </div>
            <div className="p-6 divide-y divide-border">
              {[
                {
                  key: "coursesEnabled" as const,
                  label: "Courses",
                  description:
                    "Enable the Courses module — course catalog, modules and pricing management.",
                },
                {
                  key: "seoEnabled" as const,
                  label: "SEO Settings",
                  description:
                    "Enable advanced SEO tools — meta defaults, sitemap controls, robots.txt and internal linking.",
                },
                {
                  key: "ecommerceEnabled" as const,
                  label: "E-commerce",
                  description:
                    "Enable the E-commerce module — products, brands, categories and orders.",
                },
              ].map((mod, idx) => (
                <label
                  key={mod.key}
                  className={`flex items-center justify-between gap-4 cursor-pointer py-4 ${idx === 0 ? "pt-0" : ""}`}
                  data-testid={`module-toggle-${mod.key}`}
                >
                  <div className="flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {mod.label}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {mod.description}
                    </span>
                  </div>
                  <Switch
                    checked={Boolean(settings[mod.key])}
                    onCheckedChange={(v: boolean) => updateField(mod.key, v)}
                    aria-label={`Toggle ${mod.label}`}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Reading Settings */}
          <div className="border border-border rounded-lg bg-card overflow-hidden p-2">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h2 className="text-lg font-semibold">Reading Settings</h2>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">
                Your homepage displays
              </label>

              <div className="space-y-3 ">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="homepageType"
                    value="posts"
                    checked={settings.homepageType === "posts"}
                    onChange={() => {
                      updateField("homepageType", "posts");
                      updateField("homepagePageId", null); // ← reset
                      updateField("postsPageId", null); // ← reset
                    }}
                    className="accent-primary"
                  />
                  <span className="text-sm">Your latest posts</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="homepageType"
                    value="page"
                    checked={settings.homepageType === "page"}
                    onChange={() => updateField("homepageType", "page")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">A static page</span>
                </label>
              </div>
              {settings.homepageType === "page" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Homepage
                    </label>
                    <select
                      value={settings.homepagePageId || ""}
                      onChange={(e) =>
                        updateField("homepagePageId", Number(e.target.value))
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select Homepage</option>
                      {pages.map((page: Page) => (
                        <option key={page.id} value={page.id}>
                          {page.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Posts Page
                    </label>
                    <select
                      value={settings.postsPageId || ""}
                      onChange={(e) =>
                        updateField("postsPageId", Number(e.target.value))
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select Posts Page</option>
                      {pages.map((page: Page) => (
                        <option key={page.id} value={page.id}>
                          {page.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Public Search Settings</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* ENABLE SEARCH */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Search</Label>

                  <p className="text-sm text-muted-foreground">
                    Show search bar on public website
                  </p>
                </div>

                <Switch
                  checked={settings.showSearch}
                  onCheckedChange={(value) =>
                    setSettings({
                      ...settings,
                      showSearch: value,
                    })
                  }
                />
              </div>

              {/* SEARCH PLACEHOLDER */}
              <div className="space-y-2">
                <Label>Search Placeholder</Label>

                <Input
                  placeholder="Search..."
                  value={settings.searchPlaceholder || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      searchPlaceholder: e.target.value,
                    })
                  }
                />
              </div>

              {/* SEARCH IN PAGES */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Search In Pages</Label>

                  <p className="text-sm text-muted-foreground">
                    Include pages in search results
                  </p>
                </div>

                <Switch
                  checked={settings.searchInPages}
                  onCheckedChange={(value) =>
                    setSettings({
                      ...settings,
                      searchInPages: value,
                    })
                  }
                />
              </div>

              {/* SEARCH IN POSTS */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Search In Posts</Label>

                  <p className="text-sm text-muted-foreground">
                    Include posts in search results
                  </p>
                </div>

                <Switch
                  checked={settings.searchInPosts}
                  onCheckedChange={(value) =>
                    setSettings({
                      ...settings,
                      searchInPosts: value,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            {hasChanges && (
              <button
                type="button"
                onClick={() => {
                  setSettings(initialSettings || {});
                  setHasChanges(false);
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={!hasChanges || saveStatus === "saving"}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveStatus === "saving" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {saveStatus === "success" && <CheckCircle2 className="h-4 w-4" />}
              {saveStatus === "error" && <AlertCircle className="h-4 w-4" />}
              {saveStatus === "idle" && <Save className="h-4 w-4" />}
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "success" && "Saved!"}
              {saveStatus === "error" && "Error!"}
              {saveStatus === "idle" &&
                (hasChanges ? "Save Changes" : "No Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
