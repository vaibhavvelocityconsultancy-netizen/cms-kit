"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Globe,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Settings,
  Code2,
  Share2,
  ExternalLink,
  Search,
  BarChart3,
  Monitor,
  Smartphone,
  Edit2,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { resolveSeoTemplate } from "@/src/lib/seo-template";
import { fetchers } from "@/src/lib/fetchers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SchemaItem {
  id: string;
  type:
    | "WebPage"
    | "Article"
    | "BlogPosting"
    | "FAQPage"
    | "Product"
    | "Service"
    | "LocalBusiness"
    | "Organization"
    | "Person"
    | "BreadcrumbList"
    | "HowTo"
    | "Recipe"
    | "Event"
    | "Custom";
  name: string;
  enabled: boolean;
  json: Record<string, any>;
}

interface SeoData {
  focusKeywords: string[];
  isPillarContent: boolean;
  schemaType: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  metaTitle: string;
  metaDescription: string;
  titleTemplate: string;
  separator: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  robotsNoImageIndex: boolean;
  robotsNoArchive: boolean;
  robotsNoSnippet: boolean;
  maxSnippet: number;
  maxVideoPreview: number;
  maxImagePreview: "none" | "standard" | "large";
  breadcrumbTitle: string;
  redirectEnabled: boolean;
  redirectUrl: string;
  autoAlt: boolean;
  autoTitle: boolean;

  overwriteAlt: boolean;
  overwriteTitle: boolean;

  useFilenameForAlt: boolean;
  usePageTitleForAlt: boolean;

  altTemplate: string;
  // titleTemplate: string;
  schemas: SchemaItem[];
}

interface SeoCheck {
  label: string;
  pass: boolean | null;
}

interface SeoPanelProps {
  pageTitle?: string;
  pageSlug?: string;
  pageContent?: string;
  siteUrl?: string;
  initialData?: Partial<SeoData>;
  siteName?: string;
  pageNumber?: number;
  onChange?: (data: SeoData) => void;
  onSlugChange?: (slug: string) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SEO: SeoData = {
  focusKeywords: [],
  isPillarContent: false,
  canonicalUrl: "",
  robotsIndex: true,
  robotsFollow: true,
  schemaType: "WebPage",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  metaTitle: "",
  metaDescription: "",
  titleTemplate: "%title% %sep% %sitename%",
  separator: "|",
  robotsNoImageIndex: false,
  robotsNoArchive: false,
  robotsNoSnippet: false,
  maxSnippet: -1,
  maxVideoPreview: -1,
  maxImagePreview: "large",
  breadcrumbTitle: "",
  redirectEnabled: false,
  redirectUrl: "",

  schemas: [],
  autoAlt: true,
  autoTitle: true,

  overwriteAlt: false,
  overwriteTitle: false,

  useFilenameForAlt: true,
  usePageTitleForAlt: true,

  altTemplate: "%title%",
  // titleTemplate: "%title%",
};

const SCHEMA_TYPES = [
  "WebPage",
  "Article",
  "BlogPosting",
  "Product",
  "FAQPage",
  "HowTo",
  "LocalBusiness",
  "Person",
  "Organization",
  "BreadcrumbList",
  "Service",
  "Event",
  "Recipe",
];

// Google SERP pixel limits (desktop)
const TITLE_PX_MAX = 580;
const DESC_PX_MAX = 920;

// ─── Schema Template Generators ────────────────────────────────────────────────

function generateSchemaTemplate(
  type: string,
  pageTitle: string,
  siteUrl: string,
  pageSlug: string,
): Record<string, any> {
  const baseUrl = `${siteUrl}/${pageSlug}`;

  const templates: Record<string, Record<string, any>> = {
    WebPage: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: pageTitle,
      url: baseUrl,
    },
    Article: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: pageTitle,
      url: baseUrl,
      datePublished: new Date().toISOString().split("T")[0],
      author: {
        "@type": "Person",
        name: "Author Name",
      },
    },
    BlogPosting: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: pageTitle,
      url: baseUrl,
      datePublished: new Date().toISOString().split("T")[0],
      dateModified: new Date().toISOString().split("T")[0],
      author: {
        "@type": "Person",
        name: "Author Name",
      },
    },
    Product: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: pageTitle,
      url: baseUrl,
      description: "Product description",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.5",
        reviewCount: "89",
      },
      offers: {
        "@type": "Offer",
        url: baseUrl,
        priceCurrency: "USD",
        price: "29.99",
        availability: "https://schema.org/InStock",
      },
    },
    FAQPage: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Question 1?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Answer to question 1",
          },
        },
        {
          "@type": "Question",
          name: "Question 2?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Answer to question 2",
          },
        },
      ],
    },
    HowTo: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: pageTitle,
      step: [
        {
          "@type": "HowToStep",
          name: "Step 1",
          text: "Describe step 1",
        },
        {
          "@type": "HowToStep",
          name: "Step 2",
          text: "Describe step 2",
        },
      ],
    },
    LocalBusiness: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: pageTitle,
      address: {
        "@type": "PostalAddress",
        streetAddress: "123 Main St",
        addressLocality: "City",
        addressRegion: "State",
        postalCode: "12345",
        addressCountry: "US",
      },
      telephone: "+1-555-123-4567",
      url: baseUrl,
    },
    Organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: pageTitle,
      url: baseUrl,
      logo: `${siteUrl}/logo.png`,
      sameAs: [
        "https://www.facebook.com/yourpage",
        "https://www.twitter.com/yourprofile",
      ],
    },
    BreadcrumbList: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: pageTitle,
          item: baseUrl,
        },
      ],
    },
    Service: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: pageTitle,
      url: baseUrl,
      description: "Service description",
      provider: {
        "@type": "Organization",
        name: "Your Company",
      },
    },
    Event: {
      "@context": "https://schema.org",
      "@type": "Event",
      name: pageTitle,
      url: baseUrl,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      location: {
        "@type": "Place",
        name: "Event Location",
      },
    },
    Recipe: {
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: pageTitle,
      author: {
        "@type": "Person",
        name: "Author Name",
      },
      prepTime: "PT15M",
      cookTime: "PT30M",
      totalTime: "PT45M",
      recipeYield: "4 servings",
      recipeIngredient: ["Ingredient 1", "Ingredient 2"],
      recipeInstructions: [
        {
          "@type": "HowToStep",
          text: "Step 1 instructions",
        },
      ],
    },
  };

  return templates[type] || { "@type": type };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRobotsMeta(seo: SeoData) {
  const parts = [
    seo.robotsIndex ? "index" : "noindex",
    seo.robotsFollow ? "follow" : "nofollow",
  ];
  if (seo.robotsNoImageIndex) parts.push("noimageindex");
  if (seo.robotsNoArchive) parts.push("noarchive");
  if (seo.robotsNoSnippet) parts.push("nosnippet");
  parts.push(`max-snippet:${seo.maxSnippet}`);
  parts.push(`max-video-preview:${seo.maxVideoPreview}`);
  parts.push(`max-image-preview:${seo.maxImagePreview}`);
  return parts.join(", ");
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SEPARATOR_OPTIONS = ["-", "|", "•", "–", "—", "·", "*", "~", "»"];

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

let _canvas: HTMLCanvasElement | null = null;
function measurePx(text: string, font: string): number {
  if (typeof document === "undefined") return text.length * 8;
  if (!_canvas) _canvas = document.createElement("canvas");
  const ctx = _canvas.getContext("2d");
  if (!ctx) return text.length * 8;
  ctx.font = font;
  return ctx.measureText(text).width;
}

const TITLE_FONT = "400 20px Arial, sans-serif";
const DESC_FONT = "400 14px Arial, sans-serif";

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightKeyword(text: string, keyword: string) {
  if (!keyword.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(keyword)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <strong key={i} className="font-bold">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function buildChecks(
  seo: SeoData,
  pageTitle: string,
  pageSlug: string,
  pageContent: string,
): { section: string; checks: SeoCheck[] }[] {
  const kw = seo.focusKeywords[0]?.toLowerCase() ?? "";
  const title = (seo.metaTitle || pageTitle).toLowerCase();
  const desc = seo.metaDescription.toLowerCase();
  const slug = pageSlug.toLowerCase();
  const content = stripHtml(pageContent).toLowerCase();
  const wordCount = countWords(content);
  const first10pct = content.slice(0, Math.floor(content.length * 0.1));

  return [
    {
      section: "Basic SEO",
      checks: [
        {
          label: "Focus Keyword used in SEO Title",
          pass: kw ? title.includes(kw) : null,
        },
        {
          label: "Focus Keyword used in Meta Description",
          pass: kw ? desc.includes(kw) : null,
        },
        {
          label: "Focus Keyword found in URL",
          pass: kw ? slug.includes(kw.replace(/\s+/g, "-")) : null,
        },
        {
          label: "Focus Keyword appears in first 10% of content",
          pass: kw ? first10pct.includes(kw) : null,
        },
        {
          label: "Focus Keyword found in content",
          pass: kw ? content.includes(kw) : null,
        },
        {
          label: `Content is ${wordCount} words (recommend ≥ 600)`,
          pass: wordCount >= 600 ? true : wordCount >= 300 ? null : false,
        },
      ],
    },
    {
      section: "Additional",
      checks: [
        {
          label: "Meta Title pixel width is optimal",
          pass: null,
        },
        {
          label: "Meta Description pixel width is optimal",
          pass: null,
        },
        { label: "Canonical URL is set", pass: seo.canonicalUrl.length > 0 },
        {
          label: "Schema type is configured",
          pass: seo.schemas.some((s) => s.enabled),
        },
      ],
    },
    {
      section: "Title Readability",
      checks: [
        { label: "SEO Title has a positive sentiment word", pass: null },
        {
          label: "SEO Title doesn't start with Focus Keyword",
          pass: kw ? !title.startsWith(kw) : null,
        },
        { label: "SEO Title has a number", pass: null },
      ],
    },
    {
      section: "Content Readability",
      checks: [
        {
          label: "Content uses subheadings",
          pass: /<h[2-6]/i.test(pageContent),
        },
        { label: "Images found in content", pass: /<img/i.test(pageContent) },
      ],
    },
  ];
}

function scoreSeo(groups: { section: string; checks: SeoCheck[] }[]) {
  const all = groups.flatMap((g) => g.checks).filter((c) => c.pass !== null);
  if (!all.length) return 0;
  const passed = all.filter((c) => c.pass === true).length;
  return Math.round((passed / all.length) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : score >= 50
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-red-600 bg-red-50 border-red-200";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border rounded-full ${color}`}
    >
      <BarChart3 className="h-3 w-3" />
      {score}/100
    </span>
  );
}

function CheckItem({ check }: { check: SeoCheck }) {
  const icon =
    check.pass === true ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
    ) : check.pass === null ? (
      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
    );
  return (
    <li className="flex items-start gap-2 py-1.5 text-sm text-foreground/80">
      {icon}
      <span>{check.label}</span>
    </li>
  );
}

function SectionAccordion({
  section,
  checks,
  defaultOpen,
}: {
  section: string;
  checks: SeoCheck[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const errors = checks.filter((c) => c.pass === false).length;
  const warnings = checks.filter((c) => c.pass === null).length;

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{section}</span>
          {errors > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
              ✕ {errors} Error{errors > 1 ? "s" : ""}
            </span>
          )}
          {warnings > 0 && errors === 0 && (
            <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
              ⚠ {warnings}
            </span>
          )}
          {errors === 0 && warnings === 0 && (
            <span className="text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium">
              ✓ Good
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <ul className="px-4 pb-3 space-y-0.5">
          {checks.map((c, i) => (
            <CheckItem key={i} check={c} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PixelMeter({
  px,
  max,
  chars,
  charMax,
}: {
  px: number;
  max: number;
  chars: number;
  charMax: number;
}) {
  const pct = Math.min((px / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-muted-foreground">
          {chars} / {charMax} chars
        </span>
        <span
          className={`text-xs font-medium ${px > max ? "text-red-500" : "text-muted-foreground"}`}
        >
          {Math.round(px)}px / {max}px
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
        <div className="relative h-full w-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500 rounded-full">
          <div
            className="absolute top-0 right-0 h-full bg-background/0"
            style={{
              width: `${100 - pct}%`,
              background: "var(--background, #fff)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Schema Management Sub-components ──────────────────────────────────────────

function SchemaCard({
  schema,
  onToggle,
  onEdit,
  onDelete,
}: {
  schema: SchemaItem;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const icon = schema.type === "Custom" ? Code2 : Globe;

  return (
    <div
      className={`border rounded-lg p-3 transition-all ${
        schema.enabled
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-muted/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 flex items-start gap-2">
          <button
            type="button"
            onClick={() => onToggle(schema.id)}
            className={`mt-0.5 rounded-md border transition-colors ${
              schema.enabled
                ? "bg-primary text-white border-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 p-0.5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {schema.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Type:{" "}
              <span className="font-mono bg-muted px-1 py-0.5 rounded">
                {schema.type}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(schema.id)}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            title="Edit schema"
          >
            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(schema.id)}
            className="p-1.5 hover:bg-red-100 rounded transition-colors"
            title="Delete schema"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SchemaEditor({
  schema,
  onSave,
  onCancel,
}: {
  schema: SchemaItem;
  onSave: (updated: SchemaItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(schema.name);
  const [jsonStr, setJsonStr] = useState(JSON.stringify(schema.json, null, 2));
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    try {
      const json = JSON.parse(jsonStr);
      onSave({ ...schema, name, json });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
      <div className="space-y-1">
        <label className="text-xs font-medium">Schema Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">JSON-LD</label>
          <button
            type="button"
            onClick={copyJson}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <textarea
          value={jsonStr}
          onChange={(e) => {
            setJsonStr(e.target.value);
            setError("");
          }}
          rows={10}
          className="w-full border border-border rounded px-3 py-2 text-xs bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> {error}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors"
        >
          Save Schema
        </button>
      </div>
    </div>
  );
}

function AddSchemaForm({
  pageTitle,
  siteUrl,
  pageSlug,
  onAdd,
  onCancel,
}: {
  pageTitle: string;
  siteUrl: string;
  pageSlug: string;
  onAdd: (schema: SchemaItem) => void;
  onCancel: () => void;
}) {
  const [selectedType, setSelectedType] = useState<string>("Organization");
  const [customJson, setCustomJson] = useState("");
  const [schemaName, setSchemaName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!schemaName.trim()) {
      setError("Please enter a schema name");
      return;
    }

    try {
      let json: Record<string, any>;
      if (isCustom) {
        if (!customJson.trim()) {
          setError("Please enter JSON for custom schema");
          return;
        }
        json = JSON.parse(customJson);
      } else {
        json = generateSchemaTemplate(
          selectedType,
          pageTitle,
          siteUrl,
          pageSlug,
        );
      }

      onAdd({
        id: `schema-${Date.now()}`,
        type: isCustom ? "Custom" : (selectedType as SchemaItem["type"]),
        name: schemaName,
        enabled: true,
        json,
      });

      setError("");
      setSchemaName("");
      setCustomJson("");
      setSelectedType("Organization");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  return (
    <div className="space-y-3 p-4 border border-primary/30 rounded-lg bg-primary/5">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Add New Schema</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Schema Name</label>
          <input
            type="text"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            placeholder="e.g., Main Organization, Product Review"
            className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Type</label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setIsCustom(false)}
              className={`flex-1 px-2 py-1.5 text-xs rounded border transition-colors ${
                !isCustom
                  ? "bg-primary text-white border-primary"
                  : "border-border hover:border-primary"
              }`}
            >
              Template
            </button>
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`flex-1 px-2 py-1.5 text-xs rounded border transition-colors ${
                isCustom
                  ? "bg-primary text-white border-primary"
                  : "border-border hover:border-primary"
              }`}
            >
              Custom JSON
            </button>
          </div>
        </div>
      </div>

      {!isCustom ? (
        <div className="space-y-1">
          <label className="text-xs font-medium">Select Template</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {SCHEMA_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Auto-generated templates ready to customize
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-medium">JSON-LD</label>
          <textarea
            value={customJson}
            onChange={(e) => setCustomJson(e.target.value)}
            placeholder='{ "@context": "https://schema.org", "@type": "YourType", ... }'
            rows={6}
            className="w-full border border-border rounded px-3 py-2 text-xs bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <XCircle className="h-3 w-3" /> {error}
        </p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Schema
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SeoPanel({
  pageTitle = "",
  pageSlug = "",
  pageContent = "",
  siteUrl = "https://yoursite.com",
  initialData,
  onSlugChange,
  pageNumber,
  siteName = "Your Site",
  onChange,
}: SeoPanelProps) {
  const { data: settingsData } = useQuery({
    queryKey: ["public", "settings"],
    queryFn: fetchers.publicSettings,
    staleTime: 60_000,
  });
  const configuredSiteName = settingsData?.data?.siteName?.trim() || siteName;

  const [tab, setTab] = useState<
    "general" | "advanced" | "schema" | "social" | "image"
  >("general");
  const [seo, setSeo] = useState<SeoData>({
    ...DEFAULT_SEO,
    ...initialData,
    metaTitle: initialData?.metaTitle?.trim() || DEFAULT_SEO.titleTemplate,
  });
  const [kwInput, setKwInput] = useState("");
  const [serpEdit, setSerpEdit] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [slug, setSlug] = useState(pageSlug);
  useEffect(() => {
    setSlug(pageSlug);
  }, [pageSlug]);
  const [editingSchemaId, setEditingSchemaId] = useState<string | null>(null);
  const [showAddSchema, setShowAddSchema] = useState(false);

  const kwRef = useRef<HTMLInputElement>(null);

  const handleSlugChange = (value: string) => {
    setSlug(value);
    onSlugChange?.(value);
  };

  const update = (patch: Partial<SeoData>) =>
    setSeo((prev) => ({ ...prev, ...patch }));

  const autoTitle = resolveSeoTemplate(seo.titleTemplate, {
    title: pageTitle || "Page Title",
    page: pageNumber,
    separator: seo.separator,
    siteName: configuredSiteName,
  });

  useEffect(() => {
    onChange?.(seo);
  }, [seo]);

  const addKeyword = (raw: string) => {
    const kw = raw.trim();
    if (!kw || seo.focusKeywords.includes(kw)) return;
    update({ focusKeywords: [...seo.focusKeywords, kw] });
    setKwInput("");
  };

  const removeKeyword = (kw: string) =>
    update({ focusKeywords: seo.focusKeywords.filter((k) => k !== kw) });

  const focusKw = seo.focusKeywords[0] ?? "";

  const serpTitle =
    resolveSeoTemplate(seo.metaTitle || autoTitle, {
      title: pageTitle || "Page Title",
      page: pageNumber,
      separator: seo.separator,
      siteName: configuredSiteName,
    }) ||
    pageTitle ||
    "Page Title";
  const serpSlug = slug || "page-slug";
  const serpDesc =
    seo.metaDescription ||
    stripHtml(pageContent).slice(0, 160) ||
    "Page description will appear here…";

  const titleLen = serpTitle.length;
  const descLen = seo.metaDescription.length;

  const titlePx = measurePx(serpTitle, TITLE_FONT);
  const descPx = measurePx(serpDesc, DESC_FONT);

  const checkGroups = buildChecks(seo, pageTitle, pageSlug, pageContent).map(
    (g) => {
      if (g.section !== "Additional") return g;
      return {
        ...g,
        checks: g.checks.map((c) => {
          if (c.label === "Meta Title pixel width is optimal") {
            return {
              ...c,
              pass: titlePx > 0 ? titlePx <= TITLE_PX_MAX : false,
            };
          }
          if (c.label === "Meta Description pixel width is optimal") {
            return {
              ...c,
              pass:
                descPx > 0
                  ? descPx >= DESC_PX_MAX * 0.6 && descPx <= DESC_PX_MAX
                  : false,
            };
          }
          return c;
        }),
      };
    },
  );
  const score = scoreSeo(checkGroups);

  const TABS = [
    { id: "general", label: "General", icon: Globe },
    { id: "advanced", label: "Advanced", icon: Settings },
    { id: "schema", label: "Schema", icon: Code2 },
    { id: "social", label: "Social", icon: Share2 },
    { id: "image", label: "Image", icon: Image },
  ] as const;

  // Schema handlers
  const handleAddSchema = (newSchema: SchemaItem) => {
    update({ schemas: [...seo.schemas, newSchema] });
    setShowAddSchema(false);
  };

  const handleToggleSchema = (id: string) => {
    update({
      schemas: seo.schemas.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s,
      ),
    });
  };

  const handleDeleteSchema = (id: string) => {
    update({ schemas: seo.schemas.filter((s) => s.id !== id) });
    setEditingSchemaId(null);
  };

  const handleSaveSchema = (updated: SchemaItem) => {
    update({
      schemas: seo.schemas.map((s) => (s.id === updated.id ? updated : s)),
    });
    setEditingSchemaId(null);
  };

  return (
    <div className="border border-border bg-card rounded-md overflow-hidden text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">SEO Settings</span>
          <ScoreBadge score={score} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/20">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === id
                ? "border-primary text-primary bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            {/* <Icon className="h-3.5 w-3.5" /> */}
            {label}
          </button>
        ))}
      </div>

      {/* ── GENERAL TAB ── */}
      {tab === "general" && (
        <div className="divide-y divide-border">
          {/* SERP Preview */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Preview
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded border ${
                    previewMode === "desktop"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground"
                  }`}
                  title="Desktop preview"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded border ${
                    previewMode === "mobile"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground"
                  }`}
                  title="Mobile preview"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSerpEdit((e) => !e)}
                  className="text-xs text-primary hover:underline ml-2"
                >
                  {serpEdit ? "Close" : "Edit Snippet"}
                </button>
              </div>
            </div>

            {/* SERP Card */}
            <div
              className={`border border-border rounded-md p-3 bg-white dark:bg-background space-y-0.5 ${
                previewMode === "mobile" ? "max-w-[360px]" : ""
              }`}
            >
              <p className="text-xs text-muted-foreground font-mono truncate">
                {highlightKeyword(`${siteUrl}/${serpSlug}`, focusKw)}
                <ExternalLink className="inline h-3 w-3 ml-1 opacity-50" />
              </p>
              <p className="text-blue-700 dark:text-blue-400 text-base font-medium leading-snug line-clamp-1">
                {highlightKeyword(serpTitle, focusKw)}
              </p>
              <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
                {highlightKeyword(serpDesc, focusKw)}
              </p>
            </div>

            {/* Editable snippet fields */}
            {serpEdit && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-xs font-medium">
                      SEO Title (override)
                    </label>
                    <span
                      className={`text-xs ${titleLen > 60 ? "text-red-500" : titleLen >= 50 ? "text-emerald-600" : "text-muted-foreground"}`}
                    >
                      {titleLen}/60
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={seo.metaTitle}
                      onChange={(e) => update({ metaTitle: e.target.value })}
                      placeholder="%title% %sep% %sitename%"
                      className="flex-1 border border-border rounded px-3 py-1.5 text-sm bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <select
                      value={seo.separator}
                      onChange={(e) => update({ separator: e.target.value })}
                      className="border border-border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {SEPARATOR_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available variables:{" "}
                    <code className="bg-muted px-1 rounded">%title%</code>{" "}
                    <code className="bg-muted px-1 rounded">%page%</code>{" "}
                    <code className="bg-muted px-1 rounded">%sep%</code>{" "}
                    <code className="bg-muted px-1 rounded">%sitename%</code>
                  </p>
                  <PixelMeter
                    px={titlePx}
                    max={TITLE_PX_MAX}
                    chars={titleLen}
                    charMax={60}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Meta Description
                  </label>
                  <textarea
                    value={seo.metaDescription}
                    onChange={(e) =>
                      update({ metaDescription: e.target.value })
                    }
                    placeholder="Enter meta description…"
                    rows={3}
                    className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <PixelMeter
                    px={descPx}
                    max={DESC_PX_MAX}
                    chars={descLen}
                    charMax={160}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Permalink */}
          <div className="p-4 space-y-2 border-t border-border">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Permalink
            </label>

            <div className="flex items-center rounded-md border border-border overflow-hidden">
              <div className="px-3 py-2 bg-muted text-muted-foreground text-sm whitespace-nowrap border-r">
                {siteUrl}/
              </div>

              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="flex-1 px-3 py-2 bg-background text-sm outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground break-all">
                {siteUrl}/{slug}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(`${siteUrl}/${pageSlug}`)
                }
                className="text-xs text-primary hover:underline"
              >
                Copy URL
              </button>
            </div>
          </div>

          {/* Focus Keywords */}
          <div className="p-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Focus Keywords
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[36px] border border-border rounded px-2 py-1.5 bg-background focus-within:ring-1 focus-within:ring-primary">
              {seo.focusKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                ref={kwRef}
                type="text"
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onBlur={() => addKeyword(kwInput)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addKeyword(kwInput);
                  }
                }}
                placeholder={
                  seo.focusKeywords.length === 0
                    ? "Type a keyword and press Enter…"
                    : ""
                }
                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Press{" "}
              <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px]">
                Enter
              </kbd>{" "}
              or{" "}
              <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px]">
                ,
              </kbd>{" "}
              to add, or leave the field
            </p>

            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={seo.isPillarContent}
                onChange={(e) => update({ isPillarContent: e.target.checked })}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm">This post is Pillar Content</span>
            </label>
          </div>

          {/* SEO Checks */}
          <div>
            {checkGroups.map((g) => (
              <SectionAccordion
                key={g.section}
                section={g.section}
                checks={g.checks}
                defaultOpen={g.section === "Basic SEO"}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── ADVANCED TAB ── */}
      {tab === "advanced" && (
        <div className="p-4 space-y-6">
          {/* Robots Meta */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Robots Meta
            </label>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seo.robotsIndex}
                  onChange={(e) => update({ robotsIndex: e.target.checked })}
                  className="rounded border-border accent-primary"
                />
                <span className="text-sm">Index</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!seo.robotsNoArchive}
                  onChange={(e) =>
                    update({ robotsNoArchive: !e.target.checked })
                  }
                  className="rounded border-border accent-primary"
                />
                <span className="text-sm">No Archive</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!seo.robotsFollow}
                  onChange={(e) => update({ robotsFollow: !e.target.checked })}
                  className="rounded border-border accent-primary"
                />
                <span className="text-sm">Nofollow</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seo.robotsNoSnippet}
                  onChange={(e) =>
                    update({ robotsNoSnippet: e.target.checked })
                  }
                  className="rounded border-border accent-primary"
                />
                <span className="text-sm">No Snippet</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seo.robotsNoImageIndex}
                  onChange={(e) =>
                    update({ robotsNoImageIndex: e.target.checked })
                  }
                  className="rounded border-border accent-primary"
                />
                <span className="text-sm">No Image Index</span>
              </label>
            </div>
          </div>

          {/* Advanced Robots Meta */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Advanced Robots Meta
            </label>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={seo.maxSnippet !== 0}
                    onChange={(e) =>
                      update({ maxSnippet: e.target.checked ? -1 : 0 })
                    }
                    className="rounded border-border accent-primary"
                  />
                  <span className="text-sm">Max Snippet</span>
                </label>
                <input
                  type="number"
                  value={seo.maxSnippet}
                  onChange={(e) =>
                    update({ maxSnippet: parseInt(e.target.value) || 0 })
                  }
                  className="w-24 border border-border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={seo.maxVideoPreview !== 0}
                    onChange={(e) =>
                      update({ maxVideoPreview: e.target.checked ? -1 : 0 })
                    }
                    className="rounded border-border accent-primary"
                  />
                  <span className="text-sm">Max Video Preview</span>
                </label>
                <input
                  type="number"
                  value={seo.maxVideoPreview}
                  onChange={(e) =>
                    update({ maxVideoPreview: parseInt(e.target.value) || 0 })
                  }
                  className="w-24 border border-border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={seo.maxImagePreview !== "none"}
                    onChange={(e) =>
                      update({
                        maxImagePreview: e.target.checked ? "large" : "none",
                      })
                    }
                    className="rounded border-border accent-primary"
                  />
                  <span className="text-sm">Max Image Preview</span>
                </label>
                <select
                  value={seo.maxImagePreview}
                  onChange={(e) =>
                    update({
                      maxImagePreview: e.target
                        .value as SeoData["maxImagePreview"],
                    })
                  }
                  className="w-24 border border-border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="none">None</option>
                  <option value="standard">Standard</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>

          {/* Canonical URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Canonical URL</label>
            <input
              type="url"
              value={seo.canonicalUrl}
              onChange={(e) => update({ canonicalUrl: e.target.value })}
              placeholder={`${siteUrl}/${pageSlug}`}
              className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          {/* Breadcrumb Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Breadcrumb Title</label>
            <input
              type="text"
              value={seo.breadcrumbTitle}
              onChange={(e) => update({ breadcrumbTitle: e.target.value })}
              placeholder={pageTitle || "Enter breadcrumb title…"}
              className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Redirect */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Redirect</label>
            <button
              type="button"
              onClick={() => update({ redirectEnabled: !seo.redirectEnabled })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                seo.redirectEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  seo.redirectEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          {seo.redirectEnabled && (
            <input
              type="url"
              value={seo.redirectUrl}
              onChange={(e) => update({ redirectUrl: e.target.value })}
              placeholder="https://yoursite.com/new-url"
              className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          )}

          {/* Live robots meta preview */}
          <div className="p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
            &lt;meta name="robots" content="
            <span className="text-foreground">{buildRobotsMeta(seo)}</span>"
            /&gt;
          </div>
        </div>
      )}

      {/* ── SCHEMA TAB ── */}
      {tab === "schema" && (
        <div className="p-4 space-y-4">
          {/* Schemas list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Schemas</span>
                {seo.schemas.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {seo.schemas.filter((s) => s.enabled).length}/
                    {seo.schemas.length}
                  </span>
                )}
              </div>
              {!showAddSchema && (
                <button
                  type="button"
                  onClick={() => setShowAddSchema(true)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Schema
                </button>
              )}
            </div>

            {/* Add schema form */}
            {showAddSchema && (
              <AddSchemaForm
                pageTitle={pageTitle}
                siteUrl={siteUrl}
                pageSlug={pageSlug}
                onAdd={handleAddSchema}
                onCancel={() => setShowAddSchema(false)}
              />
            )}

            {/* Schema cards */}
            {seo.schemas.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Code2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No schemas added yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add structured data to help search engines understand your
                  content
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {seo.schemas.map((schema) => (
                  <div key={schema.id}>
                    {editingSchemaId === schema.id ? (
                      <SchemaEditor
                        schema={schema}
                        onSave={handleSaveSchema}
                        onCancel={() => setEditingSchemaId(null)}
                      />
                    ) : (
                      <SchemaCard
                        schema={schema}
                        onToggle={handleToggleSchema}
                        onEdit={() => setEditingSchemaId(schema.id)}
                        onDelete={() => {
                          if (confirm("Delete this schema?")) {
                            handleDeleteSchema(schema.id);
                          }
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* JSON-LD Preview of all enabled schemas */}
          {seo.schemas.some((s) => s.enabled) && (
            <div className="mt-6 pt-6 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Combined JSON-LD Preview
              </p>
              <div className="p-3 border border-border rounded bg-muted/30 overflow-auto max-h-64">
                <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words">
                  {JSON.stringify(
                    {
                      "@context": "https://schema.org",
                      "@graph": seo.schemas
                        .filter((s) => s.enabled)
                        .map((s) => s.json),
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SOCIAL TAB ── */}
      {tab === "social" && (
        <div className="p-4 space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Open Graph (Facebook / LinkedIn)
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">OG Title</label>
              <input
                type="text"
                value={seo.ogTitle}
                onChange={(e) => update({ ogTitle: e.target.value })}
                placeholder={serpTitle}
                className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">OG Description</label>
              <textarea
                value={seo.ogDescription}
                onChange={(e) => update({ ogDescription: e.target.value })}
                placeholder={seo.metaDescription || "Social share description…"}
                rows={2}
                className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">OG Image URL</label>
              <input
                type="url"
                value={seo.ogImage}
                onChange={(e) => update({ ogImage: e.target.value })}
                placeholder="https://…/image.jpg"
                className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            {(seo.ogTitle || seo.ogDescription || seo.ogImage) && (
              <div className="border border-border rounded overflow-hidden">
                {seo.ogImage && (
                  <img
                    src={seo.ogImage}
                    alt="OG preview"
                    className="w-full h-28 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                <div className="p-2 bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase font-mono">
                    {siteUrl}
                  </p>
                  <p className="text-sm font-semibold line-clamp-1">
                    {seo.ogTitle || serpTitle}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {seo.ogDescription || seo.metaDescription}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Twitter / X Card
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Twitter Title</label>
              <input
                type="text"
                value={seo.twitterTitle}
                onChange={(e) => update({ twitterTitle: e.target.value })}
                placeholder={seo.ogTitle || serpTitle}
                className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Twitter Description</label>
              <textarea
                value={seo.twitterDescription}
                onChange={(e) => update({ twitterDescription: e.target.value })}
                placeholder={
                  seo.ogDescription ||
                  seo.metaDescription ||
                  "Twitter card description…"
                }
                rows={2}
                className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Twitter Image URL</label>
              <input
                type="url"
                value={seo.twitterImage}
                onChange={(e) => update({ twitterImage: e.target.value })}
                placeholder={seo.ogImage || "https://…/image.jpg"}
                className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGES TAB ───────────────────────────────────── */}

      {tab === "image" && (
        <div className="p-4 space-y-6">
          {/* Automatic ALT */}

          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Automatic ALT & TITLE Attributes</h3>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={seo.autoAlt}
                onChange={(e) =>
                  update({
                    autoAlt: e.target.checked,
                  })
                }
              />
              <span>Automatically add missing ALT attributes</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={seo.autoTitle}
                onChange={(e) =>
                  update({
                    autoTitle: e.target.checked,
                  })
                }
              />
              <span>Automatically add missing TITLE attributes</span>
            </label>
          </div>

          {/* Templates */}

          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Templates</h3>

            <div>
              <label className="text-xs font-medium">ALT Template</label>

              <input
                className="w-full border rounded px-3 py-2 mt-1"
                value={seo.altTemplate}
                onChange={(e) =>
                  update({
                    altTemplate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium">TITLE Template</label>

              <input
                className="w-full border rounded px-3 py-2 mt-1"
                value={seo.titleTemplate}
                onChange={(e) =>
                  update({
                    titleTemplate: e.target.value,
                  })
                }
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Available variables:
              <code className="ml-2">%title%</code>,
              <code className="ml-2">%filename%</code>,
              <code className="ml-2">%sitename%</code>
            </p>
          </div>

          {/* Generation */}

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Generation Rules</h3>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={seo.useFilenameForAlt}
                onChange={(e) =>
                  update({
                    useFilenameForAlt: e.target.checked,
                  })
                }
              />
              Generate ALT from filename
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={seo.usePageTitleForAlt}
                onChange={(e) =>
                  update({
                    usePageTitleForAlt: e.target.checked,
                  })
                }
              />
              Use page title if filename unavailable
            </label>
          </div>

          {/* Existing Images */}

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Existing Images</h3>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={seo.overwriteAlt}
                onChange={(e) =>
                  update({
                    overwriteAlt: e.target.checked,
                  })
                }
              />
              Overwrite existing ALT text
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={seo.overwriteTitle}
                onChange={(e) =>
                  update({
                    overwriteTitle: e.target.checked,
                  })
                }
              />
              Overwrite existing TITLE text
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
