"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/src/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Label } from "@/src/ui/label";
import { Switch } from "@/src/ui/switch";
import { useToast } from "@/src/ui/use-toast";
import { getApiBaseUrl } from "@/src/lib/axios";
import { appUrl } from "@/src/lib/base-path";

type AICrawlSettings = {
  enableMarkdownGeneration: boolean;
  includePages: boolean;
  includePosts: boolean;
  excludeDrafts: boolean;
};

type AICrawlContentItem = {
  id: number;
  contentType: "page" | "post";
  slug: string;
  title: string;
  wordCount: number;
  updatedAt: string;
};

const DEFAULT_SETTINGS: AICrawlSettings = {
  enableMarkdownGeneration: true,
  includePages: true,
  includePosts: true,
  excludeDrafts: true,
};

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

export default function AILLMSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AICrawlSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [llmsTxtContent, setLlmsTxtContent] = useState("");
  const [llmsStats, setLlmsStats] = useState({
    pagesCount: 0,
    postsCount: 0,
    totalCount: 0,
    lastGenerated: null as string | null,
  });

  // Fetch settings
  const { data, isLoading } = useQuery({
    queryKey: ["ai-crawl-settings"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/ai-crawl-settings"));
      if (!res.ok) throw new Error("Failed to fetch settings");
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch llms.txt
  const { data: llmsData } = useQuery({
    queryKey: ["llms-txt-content"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/llms-txt"));
      if (!res.ok) throw new Error("Failed to fetch llms.txt");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 5000,
  });

  // Fetch markdown content list
  const { data: contentList, refetch: refetchContentList } = useQuery({
    queryKey: ["ai-crawl-content"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/ai-crawl-content"));
      if (!res.ok) throw new Error("Failed to fetch content");
      const json = await res.json();
      return json.data as AICrawlContentItem[];
    },
    refetchInterval: 5000,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (newSettings: AICrawlSettings) => {
      const res = await fetch(apiPath("/api/ai-crawl-settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      const json = await res.json();
      return json.data;
    },
    onSuccess: (data) => {
      setSettings(data);
      toast({
        title: "Settings saved",
        description: "AI markdown files regenerated.",
      });
      refetchContentList();
    },
    onError: () => {
      toast({
        title: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  // Regenerate markdown mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiPath("/api/regenerate-markdown"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to regenerate");
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      toast({
        title: "Markdown files regenerated",
      });
      refetchContentList();
    },
    onError: () => {
      toast({
        title: "Failed to regenerate markdown",
        variant: "destructive",
      });
    },
  });

  // Load settings into state
  useEffect(() => {
    if (data) {
      setSettings({
        enableMarkdownGeneration: data.enableMarkdownGeneration,
        includePages: data.includePages,
        includePosts: data.includePosts,
        excludeDrafts: data.excludeDrafts,
      });
    }
  }, [data]);

  // Load llms.txt data
  useEffect(() => {
    if (llmsData) {
      setLlmsTxtContent(llmsData.content);
      setLlmsStats({
        pagesCount: llmsData.pagesCount || 0,
        postsCount: llmsData.postsCount || 0,
        totalCount: llmsData.totalCount || 0,
        lastGenerated: llmsData.lastGenerated,
      });
    }
  }, [llmsData]);

  const handleToggle = (key: keyof AICrawlSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  const handleDownloadLlmsTxt = () => {
    downloadFile(llmsTxtContent, "llms.txt", "text/plain");
    toast({
      title: "llms.txt downloaded",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const pages = contentList?.filter((c) => c.contentType === "page") || [];
  const posts = contentList?.filter((c) => c.contentType === "post") || [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>AI & LLM Settings</CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Configure how your content is indexed for AI crawlers
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">
                Enable Markdown Generation
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Auto-generate .md files for AI indexing
              </p>
            </div>
            <Switch
              checked={settings.enableMarkdownGeneration}
              onCheckedChange={() => handleToggle("enableMarkdownGeneration")}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Include Pages</Label>
              <p className="text-sm text-gray-500 mt-1">
                Add pages to markdown generation
              </p>
            </div>
            <Switch
              checked={settings.includePages}
              onCheckedChange={() => handleToggle("includePages")}
              disabled={!settings.enableMarkdownGeneration}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Include Posts</Label>
              <p className="text-sm text-gray-500 mt-1">
                Add posts to markdown generation
              </p>
            </div>
            <Switch
              checked={settings.includePosts}
              onCheckedChange={() => handleToggle("includePosts")}
              disabled={!settings.enableMarkdownGeneration}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Exclude Drafts</Label>
              <p className="text-sm text-gray-500 mt-1">
                Don't include draft/unpublished content
              </p>
            </div>
            <Switch
              checked={settings.excludeDrafts}
              onCheckedChange={() => handleToggle("excludeDrafts")}
              disabled={!settings.enableMarkdownGeneration}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || updateMutation.isPending}
              className="flex items-center gap-2"
            >
              {isSaving || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* llms.txt Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>llms.txt Preview</CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Auto-generated file for AI crawlers
              </p>
            </div>
            <Button
              onClick={handleDownloadLlmsTxt}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">Pages</p>
              <p className="text-2xl font-bold text-blue-600">
                {llmsStats.pagesCount}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Posts</p>
              <p className="text-2xl font-bold text-green-600">
                {llmsStats.postsCount}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {llmsStats.totalCount}
              </p>
            </div>
          </div>

          {llmsStats.lastGenerated && (
            <p className="text-xs text-gray-500">
              Last generated:{" "}
              {new Date(llmsStats.lastGenerated).toLocaleString()}
            </p>
          )}

          <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono">
              {llmsTxtContent || "No content generated yet"}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Markdown Content List Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Markdown Files</CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Individual .md files stored in database
              </p>
            </div>
            <Button
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              {regenerateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerate Now
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <ContentSection
            title="Pages"
            icon={<FileText className="w-5 h-5 text-blue-600" />}
            items={pages}
            emptyText="No pages generated yet"
          />

          <ContentSection
            title="Posts"
            icon={<BookOpen className="w-5 h-5 text-green-600" />}
            items={posts}
            emptyText="No posts generated yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ContentSection({
  title,
  icon,
  items,
  emptyText,
}: {
  title: string;
  icon: ReactNode;
  items: AICrawlContentItem[];
  emptyText: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg font-semibold">
          {title} ({items.length})
        </h3>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.title}</p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-1">
                  <span>Slug: {item.slug}</span>
                  <span>Words: {item.wordCount}</span>
                  <span>
                    Updated: {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <a
                  href={appUrl(`/${item.slug}.md`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </a>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{emptyText}</p>
      )}
    </div>
  );
}
