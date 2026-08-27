"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { apiMutations } from "@/src/lib/apiMutations";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "../lib/apimutation";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center bg-[#1e1e1e] text-sm text-[#858585]">
        Loading editor...
      </div>
    ),
  },
);

export function GlobalCssEditor() {
  const queryClient = useQueryClient();

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"css" | "js">("css");

  // Draft states: undefined = user hasn't edited yet → falls back to query data
  const [draftCss, setDraftCss] = useState<string | undefined>(undefined);
  const [draftJs, setDraftJs] = useState<string | undefined>(undefined);

  // ── Fetch CSS from DB ──
  const { data: savedCss = "", isLoading: fetching } = useQuery({
    queryKey: ["global-css"],
    queryFn: async () => {
      const data = await fetchers.globalCss();
      if (!data.success) throw new Error(data.message);
      return data.data?.css ?? "";
    },
    staleTime: 1000 * 60 * 10,
  });

  // ── Fetch JS from DB ──
  const { data: savedJs = "", isLoading: jsFetching } = useQuery({
    queryKey: ["global-js"],
    queryFn: async () => {
      const data = await fetchers.globalJs();
      if (!data.success) throw new Error(data.message);
      return data.data?.js ?? "";
    },
    staleTime: 1000 * 60 * 10,
  });

  // Effective values: draft overrides fetched data
  const css = draftCss ?? savedCss;
  const js = draftJs ?? savedJs;

  // ── Save Mutation ──
  const saveMutation = useMutation({
    mutationFn: async (type: "css" | "js") => {
      const value = type === "css" ? css : js;
      const data =
        type === "css"
          ? await apiMutations.updateGlobalCss(value)
          : await apiMutations.updateGlobalJs(value);
      if (!data.success) throw new Error(data.message || "Failed to save");
      return type;
    },
    onSuccess: async (type) => {
      await queryClient.invalidateQueries({ queryKey: [`global-${type}`] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err: Error) => {
      setError(err.message || "Network error — please try again");
    },
  });

  // ── Reset Mutation ──
  const resetMutation = useMutation({
    mutationFn: async (type: "css" | "js") => {
      const data =
        type === "css"
          ? await apiMutations.updateGlobalCss("")
          : await apiMutations.updateGlobalJs("");
      if (!data.success) throw new Error(data.message || "Failed to reset");
      return type;
    },
    onSuccess: async (type) => {
      // Clear the draft so the editor falls back to refetched (empty) query data
      if (type === "css") setDraftCss(undefined);
      else setDraftJs(undefined);
      await queryClient.invalidateQueries({ queryKey: [`global-${type}`] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err: Error) => {
      setError(err.message || "Network error — please try again");
    },
  });

  const loading = saveMutation.isPending || resetMutation.isPending;

  const handleSave = () => {
    setError("");
    saveMutation.mutate(activeTab);
  };

  const handleReset = () => {
    setError("");
    resetMutation.mutate(activeTab);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-sans text-2xl font-bold text-foreground mb-1">
          Global CSS
        </h1>
        <p className="text-sm font-mono text-muted-foreground">
          Applies to all public pages — loaded before page-specific CSS
        </p>
      </div>

      <div className="max-w-5xl space-y-6">
        <div className="bg-card border border-border p-6">
          <p className="text-sm text-muted-foreground mb-4">
            CSS written here applies to every page. Page-specific CSS always
            overrides global CSS.
          </p>

          {/* Monaco Editor */}
          {fetching ? (
            <div className="flex items-center justify-center h-[420px] bg-[#1e1e1e] text-sm text-[#858585]">
              Loading editor...
            </div>
          ) : (
            <div className="border border-border overflow-hidden">
              <div className="flex border-b border-border ">
                <button
                  onClick={() => setActiveTab("css")}
                  className={`px-4 py-2 ${
                    activeTab === "css" ? "border-b-2 border-primary" : ""
                  }`}
                >
                  CSS
                </button>

                <button
                  onClick={() => setActiveTab("js")}
                  className={`px-4 py-2 ${
                    activeTab === "js" ? "border-b-2 border-primary" : ""
                  }`}
                >
                  JS
                </button>
              </div>
              <MonacoEditor
                height="420px"
                language={activeTab === "css" ? "css" : "javascript"}
                value={activeTab === "css" ? css : js}
                onChange={(value) => {
                  if (activeTab === "css") {
                    setDraftCss(value || "");
                  } else {
                    setDraftJs(value || "");
                  }
                }}
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
                  autoClosingBrackets: "always" as const,
                  autoClosingQuotes: "always" as const,
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-sm text-[#858585]">
                    Loading editor...
                  </div>
                }
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={loading || fetching}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleReset}
            disabled={loading || (activeTab === "css" ? fetching : jsFetching)}
            className="px-4 py-2 bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors disabled:opacity-50"
          >
            Reset
          </button>
          {saved && (
            <span className="text-sm text-green-500">✓ Saved successfully</span>
          )}
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>

        {/* Info box */}
        <div className="bg-muted/50 border border-border p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">How it works</p>
          <p>
            → Saved to{" "}
            <code className="font-mono text-xs">SiteSettings.globalCss</code> in
            DB
          </p>
          <p>→ Loaded on every public page before page-specific CSS</p>
          <p>→ Page CSS always overrides global CSS</p>
          <p>
            → Tailwind CDN already loaded — all Tailwind classes work in pages
          </p>
        </div>
      </div>
    </div>
  );
}
