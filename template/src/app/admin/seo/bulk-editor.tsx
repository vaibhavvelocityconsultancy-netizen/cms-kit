"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/src/ui/button";
import { Card } from "@/src/ui/card";
import { Input } from "@/src/ui/input";
import { Checkbox } from "@/src/ui/checkbox";
import { Label } from "@/src/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
import { Badge } from "@/src/ui/badge";
import { Skeleton } from "@/src/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/src/ui/alert";
import {
  Search,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  FileArchive,
  Globe,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/ui/use-toast";
import { getApiBaseUrl } from "@/src/lib/axios";

interface SeoItem {
  id: string;
  type: "page" | "post";
  title: string;
  url: string;
  slug: string;
  status: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robots: string;
}

interface SeoUpdateItem {
  id: string;
  type: string;
  slug: string;
  seoData: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    canonicalUrl?: string | null;
    robots?: string | null;
  };
}

interface BulkSeoResponse {
  items: SeoItem[];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

// Helper to generate canonical URL
const generateCanonicalUrl = (slug: string) => {
  return `${SITE_URL}${slug === "home" ? "" : `/${slug}`}`;
};

// API Functions
const fetchBulkSeo = async (): Promise<BulkSeoResponse> => {
  const response = await fetch(apiPath("/api/seo/bulk"));
  const result = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch SEO data");
  }

  return {
    items: result.data.map((item: any) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      url: `/${item.slug}`,
      slug: item.slug,
      status: item.status.toLowerCase(),
      metaTitle: item.seoData?.metaTitle ?? "",
      metaDescription: item.seoData?.metaDescription ?? "",
      canonicalUrl:
        item.seoData?.canonicalUrl || generateCanonicalUrl(item.slug),
      robots:
        item.seoData?.robots ??
        `${item.seoData?.robotsIndex ? "index" : "noindex"},${item.seoData?.robotsFollow ? "follow" : "nofollow"}`,
    })),
  };
};

const saveBulkSeo = async (items: SeoUpdateItem[]): Promise<void> => {
  const response = await fetch(apiPath("/api/seo/bulk"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) throw new Error("Failed to save SEO data");
  return response.json();
};

// Helper functions
const getCharacterCountStatus = (text: string | null, max: number) => {
  if (!text) return { color: "text-muted-foreground", percentage: 0 };
  const length = text.length;
  const percentage = (length / max) * 100;

  if (percentage < 60) return { color: "text-green-600", percentage };
  if (percentage < 85) return { color: "text-orange-500", percentage };
  return { color: "text-red-500", percentage };
};

const getSeoStatus = (item: SeoItem) => {
  const hasTitle = !!item.metaTitle?.trim();
  const hasDescription = !!item.metaDescription?.trim();
  const hasCanonical = !!item.canonicalUrl?.trim();

  if (hasTitle && hasDescription && hasCanonical) {
    return {
      label: "Complete",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
  }
  if (!hasTitle) {
    return {
      label: "Missing Title",
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
  }
  if (!hasDescription) {
    return {
      label: "Missing Description",
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    };
  }
  return {
    label: "Incomplete",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
};

export default function BulkSeoEditorPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "published" | "draft"
  >("all");

  // Local state for editing
  const [localItems, setLocalItems] = useState<SeoItem[]>([]);
  const [dirtyItems, setDirtyItems] = useState<Set<string>>(new Set());
  const [originalItems, setOriginalItems] = useState<SeoItem[]>([]);

  // Queries
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bulk-seo"],
    queryFn: fetchBulkSeo,
  });

  // Mutation
  const saveMutation = useMutation({
    mutationFn: saveBulkSeo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulk-seo"] });
      setDirtyItems(new Set());
      toast({
        title: "SEO updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update SEO",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize local state from data
  useEffect(() => {
    if (data?.items) {
      setLocalItems(data.items);
      setOriginalItems(data.items);
      if (!selectedId && data.items.length > 0) {
        setSelectedId(data.items[0].id);
      }
    }
  }, [data]);

  // Filtered items based on search and status
  const filteredItems = useMemo(() => {
    return localItems.filter((item) => {
      if (
        searchQuery &&
        !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.url.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (filterStatus !== "all" && item.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [localItems, searchQuery, filterStatus]);

  // Get current selected item
  const currentItem = localItems.find((i) => i.id === selectedId);
  const isDirty = currentItem && dirtyItems.has(currentItem.id);

  // Update handlers
  const updateItem = (
    id: string,
    field: keyof SeoItem,
    value: string | null,
  ) => {
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );

    setDirtyItems((prev) => new Set(prev).add(id));
  };

  // Auto-generate canonical URL
  const autoGenerateCanonical = (id: string) => {
    const item = localItems.find((i) => i.id === id);
    if (!item) return;

    const generatedUrl = generateCanonicalUrl(item.slug);
    updateItem(id, "canonicalUrl", generatedUrl);
  };

  // Save changes
  const handleSave = () => {
    if (dirtyItems.size === 0) {
      toast({
        title: "No changes to save",
      });
      return;
    }

    const itemsToUpdate: SeoUpdateItem[] = [];
    dirtyItems.forEach((id) => {
      const item = localItems.find((i) => i.id === id);
      const original = originalItems.find((i) => i.id === id);
      if (item && original) {
        const seoData: any = {};
        if (item.metaTitle !== original.metaTitle)
          seoData.metaTitle = item.metaTitle || null;
        if (item.metaDescription !== original.metaDescription)
          seoData.metaDescription = item.metaDescription || null;
        if (item.canonicalUrl !== original.canonicalUrl)
          seoData.canonicalUrl = item.canonicalUrl || null;
        if (item.robots !== original.robots)
          seoData.robots = item.robots || null;

        if (Object.keys(seoData).length > 0) {
          itemsToUpdate.push({
            id: item.id,
            type: item.type,
            slug: item.slug,
            seoData,
          });
        }
      }
    });

    if (itemsToUpdate.length === 0) {
      toast({
        title: "No changes to save",
      });
      return;
    }

    saveMutation.mutate(itemsToUpdate);
  };

  // Reset item
  const handleReset = (id: string) => {
    const original = originalItems.find((i) => i.id === id);
    if (!original) return;

    setLocalItems((prev) =>
      prev.map((item) => (item.id === id ? original : item)),
    );

    const newDirty = new Set(dirtyItems);
    newDirty.delete(id);
    setDirtyItems(newDirty);
  };

  if (isLoading) {
    return <BulkSeoEditorSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading SEO Data</AlertTitle>
          <AlertDescription>
            Failed to load SEO data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <div className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Bulk SEO Editor
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage SEO metadata for pages and posts from a single place.
            </p>
          </div>
        </div>
        <Card className="mt-6 p-12 text-center">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Content Available</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No pages or posts available for SEO editing. Create content first to
            manage SEO metadata.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bulk SEO Editor
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage SEO metadata for pages and posts from a single place.
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - List */}
        <div className="lg:col-span-1">
          <Card className="p-0 overflow-hidden h-[600px] flex flex-col">
            {/* Search & Filter */}
            <div className="p-4 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search title or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select
                value={filterStatus}
                onValueChange={(value: any) => setFilterStatus(value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No items found
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredItems.map((item) => {
                    const isSelected = selectedId === item.id;
                    const isDirtyItem = dirtyItems.has(item.id);
                    const status = getSeoStatus(item);

                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          isSelected
                            ? "bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700"
                            : "border-transparent hover:bg-muted",
                          isDirtyItem && "border-l-4 border-l-orange-500",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.url}
                            </p>
                          </div>
                          {isDirtyItem && (
                            <div className="ml-2 h-2 w-2 rounded-full bg-orange-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Detail Editor */}
        <div className="lg:col-span-2">
          {currentItem ? (
            <Card className="p-6">
              {/* Header */}
              <div className="mb-6 pb-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {currentItem.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentItem.url} • {currentItem.type} •{" "}
                      {currentItem.status}
                    </p>
                  </div>
                  {isDirty && (
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      Unsaved
                    </Badge>
                  )}
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Meta Title */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Meta Title
                  </Label>
                  <Input
                    value={currentItem.metaTitle || ""}
                    onChange={(e) =>
                      updateItem(
                        currentItem.id,
                        "metaTitle",
                        e.target.value || null,
                      )
                    }
                    placeholder="Enter meta title"
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Recommended: 50-60 characters
                    </span>
                    <span
                      className={
                        getCharacterCountStatus(currentItem.metaTitle, 60).color
                      }
                    >
                      {currentItem.metaTitle?.length || 0} / 60
                    </span>
                  </div>
                </div>

                {/* Meta Description */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Meta Description
                  </Label>
                  <textarea
                    value={currentItem.metaDescription || ""}
                    onChange={(e) =>
                      updateItem(
                        currentItem.id,
                        "metaDescription",
                        e.target.value || null,
                      )
                    }
                    placeholder="Enter meta description"
                    className="w-full px-3 py-2 border rounded-md min-h-[80px] text-sm font-sans mb-2"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Recommended: 150-160 characters
                    </span>
                    <span
                      className={
                        getCharacterCountStatus(
                          currentItem.metaDescription,
                          160,
                        ).color
                      }
                    >
                      {currentItem.metaDescription?.length || 0} / 160
                    </span>
                  </div>
                </div>

                {/* Canonical URL */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Canonical URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentItem.canonicalUrl || ""}
                      onChange={(e) =>
                        updateItem(
                          currentItem.id,
                          "canonicalUrl",
                          e.target.value || null,
                        )
                      }
                      placeholder="https://example.com/page"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => autoGenerateCanonical(currentItem.id)}
                      title="Auto-generate from site URL and slug"
                    >
                      Auto
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click "Auto" to generate based on your site URL
                  </p>
                </div>

                {/* Robots */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Robots
                  </Label>
                  <Select
                    value={currentItem.robots || "not-set"}
                    onValueChange={(value) => {
                      updateItem(
                        currentItem.id,
                        "robots",
                        value === "not-set" ? null : value,
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-set">Not set</SelectItem>
                      <SelectItem value="index,follow">
                        Index, Follow
                      </SelectItem>
                      <SelectItem value="index,nofollow">
                        Index, NoFollow
                      </SelectItem>
                      <SelectItem value="noindex,follow">
                        NoIndex, Follow
                      </SelectItem>
                      <SelectItem value="noindex,nofollow">
                        NoIndex, NoFollow
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* SEO Status */}
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-3">SEO Completeness</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeoStatus(currentItem).color}>
                      {getSeoStatus(currentItem).label}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 space-y-1">
                    <p>
                      ✓ Meta Title: {currentItem.metaTitle?.trim() ? "✓" : "✗"}
                    </p>
                    <p>
                      ✓ Meta Description:{" "}
                      {currentItem.metaDescription?.trim() ? "✓" : "✗"}
                    </p>
                    <p>
                      ✓ Canonical URL:{" "}
                      {currentItem.canonicalUrl?.trim() ? "✓" : "✗"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={dirtyItems.size === 0 || saveMutation.isPending}
                    className="flex-1"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save All Changes
                      </>
                    )}
                  </Button>
                  {isDirty && (
                    <Button
                      variant="outline"
                      onClick={() => handleReset(currentItem.id)}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Select an item to edit</p>
            </Card>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-muted-foreground">Total</span>
              <p className="font-semibold">{localItems.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Displayed</span>
              <p className="font-semibold">{filteredItems.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Unsaved Changes</span>
              <p className="font-semibold">{dirtyItems.size}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
              {
                localItems.filter(
                  (i) => i.metaTitle && i.metaDescription && i.canonicalUrl,
                ).length
              }{" "}
              Complete
            </Badge>
            <Badge variant="outline" className="text-xs">
              <AlertTriangle className="mr-1 h-3 w-3 text-yellow-600" />
              {
                localItems.filter(
                  (i) => !i.metaTitle || !i.metaDescription || !i.canonicalUrl,
                ).length
              }{" "}
              Incomplete
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Loading Skeleton
function BulkSeoEditorSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar skeleton */}
        <div className="lg:col-span-1">
          <Card className="p-4 space-y-3 h-[600px]">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </Card>
        </div>

        {/* Right detail skeleton */}
        <div className="lg:col-span-2">
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
