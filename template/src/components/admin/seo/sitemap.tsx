"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
import { Button } from "@/src/ui/button";
import { Card } from "@/src/ui/card";
import { Switch } from "@/src/ui/switch";
import { Input } from "@/src/ui/input";
import { Checkbox } from "@/src/ui/checkbox";
import { Label } from "@/src/ui/label";
import { Skeleton } from "@/src/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/src/ui/alert";
import {
  Copy,
  Eye,
  RefreshCw,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Link2,
  Globe,
  FileArchive,
  Layers,
} from "lucide-react";
// import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/ui/use-toast";
import { getApiBaseUrl } from "@/src/lib/axios";
import { appUrl } from "@/src/lib/base-path";

// Types
interface SitemapSettings {
  sitemapEnabled: boolean;
  sitemapCacheMinutes: number;
  pingSearchEngines: boolean;
  includePages: boolean;
  includePosts: boolean;
  includeCategories: boolean;
  includeTags: boolean;
  includeCourses: boolean;
  sitemapLastGeneratedAt: string | null;
  sitemapCustomUrl: string | null;
}

interface SitemapStats {
  totalUrls: number;
  pages: number;
  posts: number;
  categories: number;
  tags: number;
  courses: number;
  lastGenerated: string | null;
}

interface SitemapPreviewEntry {
  url: string;
  priority: number;
  changeFreq: string;
  lastModified: string;
}

interface SitemapPreview {
  entries: SitemapPreviewEntry[];
  total: number;
}

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

// API Functions
const fetchSitemapSettings = async () => {
  const response = await fetch(apiPath("/api/seo/sitemap"));
  const json = await response.json();

  if (!response.ok) throw new Error(json.message);

  return json.data;
};

const fetchSitemapStats = async (): Promise<SitemapStats> => {
  const response = await fetch(apiPath("/api/seo/sitemap/stats"));
  const json = await response.json();
  if (!response.ok) throw new Error(json.message);
  return json.data;
};

const fetchSitemapPreview = async (): Promise<SitemapPreview> => {
  const response = await fetch(apiPath("/api/seo/sitemap/preview"));
  const json = await response.json();

  if (!response.ok) throw new Error(json.message);

  return {
    entries: json.data,
    total: json.data.length,
  };
};
const updateSitemapSettings = async (data: Partial<SitemapSettings>) => {
  const response = await fetch(apiPath("/api/seo/sitemap"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update sitemap settings");
  return response.json();
};

const regenerateSitemap = async () => {
  const response = await fetch(apiPath("/api/seo/sitemap/regenerate"), {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to regenerate sitemap");
  return response.json();
};

export default function SitemapSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Partial<SitemapSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Queries
  const {
    data: settingsData,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["sitemap-settings"],
    queryFn: fetchSitemapSettings,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["sitemap-stats"],
    queryFn: fetchSitemapStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ["sitemap-preview"],
    queryFn: fetchSitemapPreview,
    refetchInterval: 30000,
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: updateSitemapSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sitemap-settings"] });
      queryClient.invalidateQueries({ queryKey: ["sitemap-stats"] });
      queryClient.invalidateQueries({ queryKey: ["sitemap-preview"] });
      setHasChanges(false);
      toast({
        title: "Sitemap settings updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateSitemap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sitemap-settings"] });
      queryClient.invalidateQueries({ queryKey: ["sitemap-stats"] });
      queryClient.invalidateQueries({ queryKey: ["sitemap-preview"] });
      toast({
        title: "Sitemap regenerated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to regenerate sitemap",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize settings from data
  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  // Handle setting changes
  const handleSettingChange = <K extends keyof SitemapSettings>(
    key: K,
    value: SitemapSettings[K],
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      setHasChanges(true);
      return newSettings;
    });
  };

  // Handle save
  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  // Handle reset
  const handleReset = () => {
    if (settingsData) {
      setSettings(settingsData);
      setHasChanges(false);
      toast({
        title: "Settings reset to defaults",
      });
    }
  };

  // Handle regenerate
  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  // Handle copy URL
  const handleCopyUrl = () => {
    const url =
      settingsData?.sitemapCustomUrl || `${window.location.origin}/sitemap.xml`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Sitemap URL copied",
    });
  };

  // Get sitemap URL
  const getSitemapUrl = () => {
    return (
      settingsData?.sitemapCustomUrl || appUrl("/sitemap.xml")
    );
  };

  // Validate settings
  const getValidationWarnings = () => {
    const warnings: string[] = [];
    if (!settings.sitemapEnabled) {
      warnings.push(
        "Sitemap is currently disabled. Search engines won't be able to discover your content through sitemap.",
      );
    }
    if (settings.sitemapEnabled) {
      if (
        !settings.includePages &&
        !settings.includePosts &&
        !settings.includeCategories &&
        !settings.includeTags &&
        !settings.includeCourses
      ) {
        warnings.push(
          "No content types are selected for inclusion. Your sitemap will be empty.",
        );
      }
      if (statsData && statsData.totalUrls === 0) {
        warnings.push("Your sitemap is empty. No URLs are being included.");
      }
    }
    return warnings;
  };

  const warnings = getValidationWarnings();

  // Loading skeleton
  if (settingsLoading) {
    return <SitemapSettingsSkeleton />;
  }

  // Error state
  if (settingsError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Settings</AlertTitle>
          <AlertDescription>
            Failed to load sitemap settings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sitemap</h1>
          <p className="text-sm text-muted-foreground">
            Manage your XML sitemap and control which content is included for
            search engines.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getSitemapUrl(), "_blank")}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Sitemap
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerateMutation.isPending}
          >
            <RefreshCw
              className={cn(
                "mr-2 h-4 w-4",
                regenerateMutation.isPending && "animate-spin",
              )}
            />
            Regenerate Sitemap
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyUrl}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Sitemap URL
          </Button>
        </div>
      </div>

      {/* Section 1 - General Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">General Settings</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-sitemap">Enable Sitemap</Label>
              <p className="text-sm text-muted-foreground">
                Enable XML sitemap generation for your website
              </p>
            </div>
            <Switch
              id="enable-sitemap"
              checked={settings.sitemapEnabled}
              onCheckedChange={(checked) =>
                handleSettingChange("sitemapEnabled", checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cache-duration">Cache Duration (Minutes)</Label>
            <Input
              id="cache-duration"
              type="number"
              min={1}
              max={1440}
              value={settings.sitemapCacheMinutes || 60}
              onChange={(e) =>
                handleSettingChange(
                  "sitemapCacheMinutes",
                  parseInt(e.target.value) || 60,
                )
              }
              className="max-w-[200px]"
            />
            <p className="text-sm text-muted-foreground">
              How long to cache the sitemap (1-1440 minutes)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ping-search">Notify Search Engines</Label>
              <p className="text-sm text-muted-foreground">
                Automatically notify search engines when sitemap changes
              </p>
            </div>
            <Switch
              id="ping-search"
              checked={settings.pingSearchEngines}
              onCheckedChange={(checked) =>
                handleSettingChange("pingSearchEngines", checked)
              }
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-medium">Current Sitemap URL</p>
            <p className="text-sm text-muted-foreground mt-1">
              <Link2 className="inline h-3 w-3 mr-1" />
              {getSitemapUrl()}
            </p>
          </div>
        </div>
      </Card>

      {/* Section 2 - Included Content */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Included Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { id: "includePages", label: "Pages", icon: FileText },
            { id: "includePosts", label: "Posts", icon: FileArchive },
            { id: "includeCategories", label: "Categories", icon: Layers },
            { id: "includeTags", label: "Tags", icon: Globe },
            // { id: "includeCourses", label: "Courses", icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <div key={id} className="flex items-center space-x-2">
              <Checkbox
                id={id}
                checked={settings[id as keyof SitemapSettings] as boolean}
                onCheckedChange={(checked) =>
                  handleSettingChange(id as keyof SitemapSettings, checked)
                }
              />
              <Label
                htmlFor={id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 3 - Sitemap Statistics */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sitemap Statistics</h2>
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Sitemap Status"
              value={settings.sitemapEnabled ? "Enabled" : "Disabled"}
              icon={CheckCircle}
              className={
                settings.sitemapEnabled ? "text-green-600" : "text-gray-400"
              }
            />
            <StatCard
              label="Total URLs"
              value={statsData?.totalUrls || 0}
              icon={Globe}
            />
            <StatCard
              label="Pages"
              value={statsData?.pages || 0}
              icon={FileText}
            />
            <StatCard
              label="Posts"
              value={statsData?.posts || 0}
              icon={FileArchive}
            />
            <StatCard
              label="Categories"
              value={statsData?.categories || 0}
              icon={Layers}
            />
            <StatCard label="Tags" value={statsData?.tags || 0} icon={Globe} />
            <StatCard
              label="Courses"
              value={statsData?.courses || 0}
              icon={FileText}
            />
            <StatCard
              label="Last Generated"
              value={
                statsData?.lastGenerated
                  ? format(new Date(statsData.lastGenerated), "PPp")
                  : "Never"
              }
              icon={Clock}
            />
          </div>
        )}
      </Card>

      {/* Section 4 - Preview */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        {previewLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 font-medium text-sm">
                <div>URL</div>
                <div>Priority</div>
                <div>Change Frequency</div>
                <div>Last Modified</div>
              </div>
              {Array.isArray(previewData?.entries) &&
                previewData.entries.map((entry, index) => (
                  <div
                    key={index}
                    className={cn(
                      "grid grid-cols-4 gap-4 p-3 text-sm",
                      index % 2 === 0 ? "bg-background" : "bg-muted/30",
                    )}
                  >
                    <div className="font-mono truncate">{entry.url}</div>
                    <div>{entry.priority}</div>
                    <div className="capitalize">{entry.changeFreq}</div>
                    <div>{format(new Date(entry.lastModified), "PPp")}</div>
                  </div>
                ))}
            </div>
            {previewData && previewData.total > 15 && (
              <p className="text-sm text-muted-foreground text-center">
                +{previewData.total - 15} more URLs...
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Section 5 - Validation */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <Alert key={index} variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || updateMutation.isPending}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <p className={cn("mt-1 text-2xl font-semibold", className)}>{value}</p>
    </div>
  );
}

// Loading Skeleton
function SitemapSettingsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* General Settings Skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </Card>

      {/* Content Skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </Card>

      {/* Stats Skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </Card>

      {/* Footer Actions Skeleton */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}
