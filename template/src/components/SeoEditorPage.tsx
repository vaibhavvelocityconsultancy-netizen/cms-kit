"use client";

import { useState, useRef } from "react";
import {
  ArrowLeft,
  Globe,
  Settings,
  Code2,
  Share2,
  Plus,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { Page } from "./admin/Cms";
import { SeoPanel } from "./admin/pages/seo-pannel";
// import { Page } from "./Cms";
// import { SeoPanel } from "./seo-pannel";

interface SeoEditorPageProps {
  page: Page;
  onSave: (seoData: any) => Promise<void>;
  onBack: () => void;
}

export function SeoEditorPage({ page, onSave, onBack }: SeoEditorPageProps) {
  const [activeTab, setActiveTab] = useState<
    "general" | "advanced" | "schema" | "social"
  >("general");
  const [isSaving, setIsSaving] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SIDEBAR_TABS = [
    { id: "general", label: "General", icon: Globe },
    { id: "advanced", label: "Advanced", icon: Settings },
    { id: "schema", label: "Schema", icon: Code2 },
    { id: "social", label: "Social", icon: Share2 },
  ] as const;

  const handleSeoChange = async (seoData: any) => {
    setIsSaving(true);
    try {
      await onSave(seoData);
    } finally {
      setIsSaving(false);
    }
  };

  // Export current SEO data as JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(page.seoData || {}, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `seo-${page.slug}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON modal
  const handleImportJson = () => {
    setImportError("");
    setImportSuccess(false);
    setJsonInput("");
    setShowImportModal(true);
  };

  const handlePasteJson = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      await handleSeoChange(parsed);
      setImportSuccess(true);
      setShowImportModal(false);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Invalid JSON format"
      );
    }
  };

  // File upload
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await handleSeoChange(parsed);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Failed to read file"
      );
    }
  };

  // Validate JSON-LD
  const validateJsonLd = (data: any) => {
    const required = ["@context", "@type"];
    const missing = required.filter((k) => !data[k]);
    return missing.length === 0;
  };

  const isValidJsonLd = validateJsonLd(page.seoData || {});

  return (
    <div className="flex h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Editor
            </button>
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm font-semibold text-foreground">
              SEO Settings
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-xs text-muted-foreground">Saving...</span>
            )}
          </div>
        </div>
      </div>

      {/* Main content with left sidebar */}
      <div className="flex w-full mt-16">
        {/* Left Sidebar Navigation */}
        <div className="w-56 bg-card border-r border-border p-4 flex flex-col gap-2">
          {SIDEBAR_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}

          {/* Help section */}
          <div className="mt-auto pt-4 border-t border-border">
            <div className="p-3 bg-primary/5 rounded-md">
              <p className="text-xs font-medium text-primary mb-1">
                💡 SEO Tip
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Focus on one primary keyword per page and use it naturally in
                your title and description.
              </p>
            </div>
          </div>
        </div>

        {/* Center Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-4xl mx-auto">
            <SeoPanel
              pageTitle={page.title}
              pageSlug={page.slug}
              pageContent={page.html || ""}
              siteUrl={
                process.env.NEXT_PUBLIC_SITE_URL ||
                "https://yoursite.com"
              }
              
              siteName={
                process.env.NEXT_PUBLIC_SITE_NAME || "Your Site"
              }
              initialData={page.seoData}
              onChange={handleSeoChange}
              // Force the tab to match the sidebar tab
              initialTab={activeTab}
            />
          </div>
        </div>

        {/* Right Panel - Schema Import/Export */}
        <div className="w-80 bg-muted/30 border-l border-border p-6 flex flex-col gap-4 overflow-auto">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Code2 size={16} />
              Schema Markup
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add structured data to help search engines understand your content
              and display rich results.
            </p>
          </div>

          {/* Status Badge */}
          <div
            className={`flex items-start gap-2 p-3 rounded-md border ${
              isValidJsonLd
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
            }`}
          >
            {isValidJsonLd ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              {isValidJsonLd ? (
                <>
                  <p className="font-semibold">Valid JSON-LD</p>
                  <p className="opacity-80">Schema markup detected</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">No Schema Detected</p>
                  <p className="opacity-80">Add schema in the Schema tab</p>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleExportJson}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              <Download size={14} />
              Export JSON
            </button>

            <button
              onClick={handleImportJson}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-md hover:bg-muted transition-colors"
            >
              <Upload size={14} />
              Paste JSON
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-md hover:bg-muted transition-colors"
            >
              <Plus size={14} />
              Upload File
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleUploadFile}
              className="hidden"
            />
          </div>

          {/* JSON Preview */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              Current Schema
            </p>
            <div className="bg-background border border-border rounded-md p-3 overflow-auto max-h-64">
              <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap break-words">
                {JSON.stringify(page.seoData || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Import Schema JSON</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste your JSON-LD schema here...'
              rows={8}
              className="w-full border border-border rounded-md p-3 font-mono text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-4"
            />

            {importError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                <p className="font-semibold">Error parsing JSON</p>
                <p className="text-xs mt-1">{importError}</p>
              </div>
            )}

            {importSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} />
                Schema imported successfully!
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteJson}
                className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}