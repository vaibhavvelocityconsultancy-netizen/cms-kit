"use client";

import { useState, useMemo, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/src/lib/axios";
import {
  ExternalLink,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle2,
  Info,
  FileText,
  X,
  Bot,
  Trash2,
  Plus,
} from "lucide-react";
import { appUrl } from "@/src/lib/base-path";

const AI_CRAWLER_RULES = [
  {
    id: "gptbot",
    label: "GPTBot",
    userAgent: "GPTBot",
    description: "OpenAI crawler used for AI model training.",
  },
  {
    id: "chatgpt-user",
    label: "ChatGPT",
    userAgent: "ChatGPT-User",
    description: "OpenAI user-triggered browsing requests.",
  },
  {
    id: "perplexitybot",
    label: "Perplexity",
    userAgent: "PerplexityBot",
    description: "Perplexity AI crawler.",
  },
  {
    id: "claudebot",
    label: "Claude",
    userAgent: "ClaudeBot",
    description: "Anthropic Claude crawler.",
  },
  {
    id: "google-extended",
    label: "Google AI",
    userAgent: "Google-Extended",
    description: "Google AI training and Gemini-related crawler control.",
  },
];

function buildAllowBlock(userAgent: string) {
  return `# AI crawler: ${userAgent}
User-agent: ${userAgent}
Allow: /
# End AI crawler: ${userAgent}`;
}

function hasCrawlerAllowBlock(content: string, userAgent: string) {
  const blockRegex = new RegExp(
    `# AI crawler: ${escapeRegExp(userAgent)}[\\s\\S]*?Allow:\\s*/[\\s\\S]*?# End AI crawler: ${escapeRegExp(userAgent)}`,
    "i",
  );
  const directiveRegex = new RegExp(
    `User-agent:\\s*${escapeRegExp(userAgent)}\\s*[\\r\\n]+Allow:\\s*/`,
    "i",
  );

  return blockRegex.test(content) || directiveRegex.test(content);
}

function setCrawlerAllowBlock(
  content: string,
  userAgent: string,
  enabled: boolean,
) {
  const blockRegex = new RegExp(
    `\\n*# AI crawler: ${escapeRegExp(userAgent)}[\\s\\S]*?# End AI crawler: ${escapeRegExp(userAgent)}\\n*`,
    "i",
  );
  const withoutBlock = content.replace(blockRegex, "\n\n").trim();

  if (!enabled) {
    return withoutBlock;
  }

  return `${withoutBlock ? `${withoutBlock}\n\n` : ""}${buildAllowBlock(userAgent)}\n`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type CustomCrawler = {
  userAgent: string;
  enabled: boolean;
};

type CrawlerCardProps = {
  label: string;
  userAgent: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
};

function buildCrawlerStateKey(kind: "built-in" | "custom", value: string) {
  return `${kind}:${value}`;
}

function CrawlerCard({
  label,
  userAgent,
  description,
  enabled,
  onToggle,
  onDelete,
  showDelete = false,
}: CrawlerCardProps) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground">{label}</h4>
          <code className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
            {userAgent}
          </code>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="ml-3 flex items-center gap-2">
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label={`Delete ${label}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          role="switch"
          aria-checked={enabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
            enabled ? "bg-green-600" : "bg-gray-300"
          }`}
          style={{ minWidth: "44px" }}
        >
          <span
            className="inline-block h-5 w-5 rounded-full bg-white transition-transform shadow-md"
            style={{
              transform: enabled ? "translateX(24px)" : "translateX(2px)",
            }}
          />
        </button>
      </div>
    </div>
  );
}

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

export function SeoSettingsSection() {
  const queryClient = useQueryClient();

  const [draftRobots, setDraftRobots] = useState<string | undefined>(undefined);
  const [draftEnabled, setDraftEnabled] = useState<boolean | undefined>(
    undefined,
  );
  const [aiCrawlerStates, setAiCrawlerStates] = useState<
    Record<string, boolean>
  >({});
  const [customCrawlers, setCustomCrawlers] = useState<CustomCrawler[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCrawlerName, setNewCrawlerName] = useState("");
  const [newCrawlerDefaultEnabled, setNewCrawlerDefaultEnabled] =
    useState(true);
  const [addCrawlerError, setAddCrawlerError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // ── Fetch robots.txt from DB ──
  const { data, isLoading: fetching } = useQuery({
    queryKey: ["robots-txt"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/seo/robots"));
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      return {
        robotsContent: result.data?.robotsContent ?? "",
        robotsEnabled: result.data?.robotsEnabled ?? true,
        customCrawlers: Array.isArray(result.data?.customCrawlers)
          ? result.data.customCrawlers
          : [],
        updatedAt: result.data?.updatedAt ?? null,
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (data?.customCrawlers) {
      setCustomCrawlers(data.customCrawlers);
    }
  }, [data?.customCrawlers]);

  // Initialize from API data and detect which crawlers are enabled
  useEffect(() => {
    if (data && draftEnabled === undefined) {
      setDraftEnabled(data.robotsEnabled);
      setLastUpdated(data.updatedAt);
    }

    if (data) {
      const crawlerStates: Record<string, boolean> = {};
      AI_CRAWLER_RULES.forEach((crawler) => {
        crawlerStates[buildCrawlerStateKey("built-in", crawler.id)] =
          hasCrawlerAllowBlock(data.robotsContent, crawler.userAgent);
      });

      customCrawlers.forEach((crawler) => {
        crawlerStates[buildCrawlerStateKey("custom", crawler.userAgent)] =
          hasCrawlerAllowBlock(data.robotsContent, crawler.userAgent);
      });

      setAiCrawlerStates((prev) => ({ ...prev, ...crawlerStates }));
    }
  }, [data, draftEnabled, customCrawlers]);

  // Effective values: draft overrides fetched data
  const robots = draftRobots ?? data?.robotsContent ?? "";
  const isEnabled = draftEnabled ?? data?.robotsEnabled ?? true;

  // ── Change Detection ──
  const hasContentChanged =
    draftRobots !== undefined && draftRobots !== data?.robotsContent;
  const hasToggleChanged =
    draftEnabled !== undefined && draftEnabled !== data?.robotsEnabled;
  const hasChanges = hasContentChanged || hasToggleChanged;

  // ── Validation ──
  const validation = useMemo(() => {
    const warnings: string[] = [];

    if (!robots.trim()) {
      warnings.push("Robots.txt content is empty");
    }

    if (!robots.includes("User-agent:")) {
      warnings.push("Missing 'User-agent:' directive");
    }

    if (!robots.includes("Sitemap:")) {
      warnings.push("Missing 'Sitemap:' directive (recommended)");
    }

    return warnings;
  }, [robots]);

  const lines = robots.split("\n").length;
  const characters = robots.length;

  // ── Save Mutation ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiPath("/api/seo/robots"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robotsEnabled: isEnabled,
          robotsContent: robots,
          customCrawlers,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to save");
      return result;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["robots-txt"] });
      setDraftRobots(undefined);
      setDraftEnabled(undefined);
      setLastUpdated(result.data?.updatedAt ?? new Date().toISOString());
      showToast("Robots.txt updated successfully", "success");
    },
    onError: (err: Error) => {
      showToast(err.message || "Network error — please try again", "error");
    },
  });

  // ── Reset Mutation ──
  const resetMutation = useMutation({
    mutationFn: async () => {
      const defaultRobots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
      const res = await fetch(apiPath("/api/seo/robots"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robotsEnabled: true,
          robotsContent: defaultRobots,
          customCrawlers: [],
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to reset");
      return result;
    },
    onSuccess: async (result) => {
      setDraftRobots(undefined);
      setDraftEnabled(true);
      setLastUpdated(result.data?.updatedAt ?? new Date().toISOString());

      // Reset AI crawler states
      const crawlerStates: Record<string, boolean> = {};
      AI_CRAWLER_RULES.forEach((crawler) => {
        crawlerStates[buildCrawlerStateKey("built-in", crawler.id)] = false;
      });
      setAiCrawlerStates(crawlerStates);
      setCustomCrawlers([]);

      await queryClient.invalidateQueries({ queryKey: ["robots-txt"] });
      showToast("Robots.txt restored to default", "success");
    },
    onError: (err: Error) => {
      showToast(err.message || "Network error — please try again", "error");
    },
  });

  const loading = saveMutation.isPending || resetMutation.isPending;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    if (type === "success") {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleReset = () => {
    resetMutation.mutate();
  };

  const handleToggle = () => {
    setDraftEnabled(!isEnabled);
  };

  const handleCrawlerToggle = (
    kind: "built-in" | "custom",
    value: string,
    userAgent: string,
    enabled: boolean,
  ) => {
    const updatedContent = setCrawlerAllowBlock(robots, userAgent, enabled);
    setDraftRobots(updatedContent);

    if (kind === "custom") {
      setCustomCrawlers((prev) =>
        prev.map((crawler) =>
          crawler.userAgent.toLowerCase() === userAgent.toLowerCase()
            ? { ...crawler, enabled }
            : crawler,
        ),
      );
    }

    setAiCrawlerStates((prev) => ({
      ...prev,
      [buildCrawlerStateKey(kind, value)]: enabled,
    }));
  };

  const handleAddCrawler = () => {
    const trimmedName = newCrawlerName.trim();

    if (!trimmedName) {
      setAddCrawlerError("Crawler name is required.");
      return;
    }

    const normalizedName = trimmedName;
    const duplicate =
      AI_CRAWLER_RULES.some(
        (crawler) =>
          crawler.userAgent.toLowerCase() === normalizedName.toLowerCase() ||
          crawler.label.toLowerCase() === normalizedName.toLowerCase(),
      ) ||
      customCrawlers.some(
        (crawler) =>
          crawler.userAgent.toLowerCase() === normalizedName.toLowerCase(),
      );

    if (duplicate) {
      setAddCrawlerError("A crawler with that name already exists.");
      return;
    }

    const nextCrawler: CustomCrawler = {
      userAgent: normalizedName,
      enabled: newCrawlerDefaultEnabled,
    };

    setCustomCrawlers((prev) => [...prev, nextCrawler]);
    setDraftRobots(
      setCrawlerAllowBlock(robots, normalizedName, newCrawlerDefaultEnabled),
    );
    setAiCrawlerStates((prev) => ({
      ...prev,
      [buildCrawlerStateKey("custom", normalizedName)]:
        newCrawlerDefaultEnabled,
    }));
    setNewCrawlerName("");
    setNewCrawlerDefaultEnabled(true);
    setAddCrawlerError(null);
    setIsAddModalOpen(false);
  };

  const handleDeleteCustomCrawler = (userAgent: string) => {
    const nextCrawlers = customCrawlers.filter(
      (crawler) => crawler.userAgent.toLowerCase() !== userAgent.toLowerCase(),
    );

    setCustomCrawlers(nextCrawlers);
    setDraftRobots(setCrawlerAllowBlock(robots, userAgent, false));
    setAiCrawlerStates((prev) => {
      const next = { ...prev };
      delete next[buildCrawlerStateKey("custom", userAgent)];
      return next;
    });
  };

  const handleOpenLive = () => {
    window.open(appUrl("/robots.txt"), "_blank");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto py-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
            {toast.type === "success" && (
              <button
                onClick={handleOpenLive}
                className="ml-2 inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800 transition-colors"
              >
                Open Live
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Robots.txt</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control how search engines crawl and index your website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenLive}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Live
          </button>
          <button
            onClick={handleReset}
            disabled={loading || fetching}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Restore Default
          </button>
          <button
            onClick={handleSave}
            disabled={loading || fetching || !hasChanges}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : hasChanges ? "Save Changes" : "No changes"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">
                Enable Custom robots.txt
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                When disabled, the CMS automatically generates a default
                robots.txt
              </p>
            </div>
            <button
              onClick={handleToggle}
              role="switch"
              aria-checked={isEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isEnabled ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Disabled Notice */}
        {!isEnabled && (
          <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Custom robots.txt is disabled. The CMS is currently serving the
              default robots.txt.
            </p>
          </div>
        )}

        {/* AI Crawler Rules Section */}
        {isEnabled && (
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                AI Crawler Access
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Allow or block AI crawlers from accessing your content. Toggles
              automatically update robots.txt.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">
                  Built-in Crawlers
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AI_CRAWLER_RULES.map((crawler) => (
                  <CrawlerCard
                    key={crawler.id}
                    label={crawler.label}
                    userAgent={crawler.userAgent}
                    description={crawler.description}
                    enabled={
                      aiCrawlerStates[
                        buildCrawlerStateKey("built-in", crawler.id)
                      ] ?? false
                    }
                    onToggle={() =>
                      handleCrawlerToggle(
                        "built-in",
                        crawler.id,
                        crawler.userAgent,
                        !(
                          aiCrawlerStates[
                            buildCrawlerStateKey("built-in", crawler.id)
                          ] ?? false
                        ),
                      )
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">
                  Custom Crawlers
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setAddCrawlerError(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Crawler
                </button>
              </div>

              {customCrawlers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No custom crawlers yet. Add one to extend robots.txt rules.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customCrawlers.map((crawler) => (
                    <CrawlerCard
                      key={buildCrawlerStateKey("custom", crawler.userAgent)}
                      label={crawler.userAgent}
                      userAgent={crawler.userAgent}
                      description="Custom crawler rule managed from this panel."
                      enabled={
                        aiCrawlerStates[
                          buildCrawlerStateKey("custom", crawler.userAgent)
                        ] ?? crawler.enabled
                      }
                      onToggle={() =>
                        handleCrawlerToggle(
                          "custom",
                          crawler.userAgent,
                          crawler.userAgent,
                          !(
                            aiCrawlerStates[
                              buildCrawlerStateKey("custom", crawler.userAgent)
                            ] ?? crawler.enabled
                          ),
                        )
                      }
                      onDelete={() =>
                        handleDeleteCustomCrawler(crawler.userAgent)
                      }
                      showDelete
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  Add Crawler
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setAddCrawlerError(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Crawler Name
                  </label>
                  <input
                    value={newCrawlerName}
                    onChange={(event) => {
                      setNewCrawlerName(event.target.value);
                      if (addCrawlerError) setAddCrawlerError(null);
                    }}
                    placeholder="MyCrawler"
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Default State
                  </label>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCrawlerDefaultEnabled(true)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                        newCrawlerDefaultEnabled
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      Enabled
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCrawlerDefaultEnabled(false)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                        !newCrawlerDefaultEnabled
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      Disabled
                    </button>
                  </div>
                </div>

                {addCrawlerError && (
                  <p className="text-sm text-red-600">{addCrawlerError}</p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setAddCrawlerError(null);
                  }}
                  className="px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCrawler}
                  className="px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editor Section */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Robots.txt Content
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                isEnabled
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isEnabled ? "Custom" : "Default"}
            </span>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center h-[500px] bg-[#1e1e1e] text-sm text-[#858585]">
              Loading editor...
            </div>
          ) : (
            <div className={!isEnabled ? "opacity-50 pointer-events-none" : ""}>
              <Editor
                height="500px"
                language="ini"
                value={robots}
                onChange={(value) => setDraftRobots(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  formatOnPaste: true,
                  formatOnType: true,
                  readOnly: !isEnabled,
                  padding: { top: 16, bottom: 16 },
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-sm text-[#858585]">
                    Loading editor...
                  </div>
                }
              />
            </div>
          )}

          {/* Status Bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <div className="flex items-center gap-6">
              <span>Lines: {lines}</span>
              <span>Characters: {characters}</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isEnabled ? "bg-primary" : "bg-muted-foreground"
                  }`}
                />
                Mode: {isEnabled ? "Custom" : "Default"}
              </span>
            </div>
            {lastUpdated && <span>Last updated {formatDate(lastUpdated)}</span>}
          </div>
        </div>

        {/* Validation Card */}
        {isEnabled && validation.length > 0 && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30">
              <h4 className="text-sm font-medium text-foreground">
                Validation
              </h4>
            </div>
            <div className="p-4 space-y-2">
              {validation.map((warning, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span className="text-yellow-800">{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  Editing robots.txt incorrectly may prevent search engines from
                  crawling parts of your website.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 bg-muted rounded text-xs font-mono text-foreground">
                  /robots.txt
                </code>
                <button
                  onClick={handleOpenLive}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  View live file
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
