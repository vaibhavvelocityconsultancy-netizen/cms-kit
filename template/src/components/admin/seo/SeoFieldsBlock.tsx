// src/components/admin/seo/SeoFieldsBlock.tsx
"use client";

/**
 * Reusable SEO fields block for any admin entity form
 * (Products, Pages, Posts, Courses, etc).
 *
 * Usage:
 *   <SeoFieldsBlock
 *     value={form.seoData}
 *     onChange={(next) => updateField("seoData", next)}
 *     entityLabel="product"
 *   />
 *
 * Extend the SeoData type as more fields become required (og:image,
 * canonical, robots, schema, etc). The API just stores the object as
 * JSON, so keeping the shape backward-compatible is the only rule.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/ui/card";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Textarea } from "@/src/ui/textarea";
import { Search } from "lucide-react";

export interface SeoData {
  metaTitle?: string;
  metaDescription?: string;
  // Reserved for future extension — add optional fields here as needed
  // (canonicalUrl, ogImage, robots, schemaJson, etc.). All fields must
  // stay optional so old records without them still deserialize cleanly.
  [key: string]: unknown;
}

interface SeoFieldsBlockProps {
  value?: SeoData | null;
  onChange: (next: SeoData) => void;
  /** e.g. "product", "post" — used only for placeholder copy */
  entityLabel?: string;
  /** Optional heading override */
  title?: string;
  description?: string;
  /** Optional site title used in the search snippet preview */
  siteName?: string;
  /** Optional public slug/path used in the search snippet preview */
  previewPath?: string;
}

const TITLE_MAX = 60;
const DESC_MAX = 160;

export function SeoFieldsBlock({
  value,
  onChange,
  entityLabel = "item",
  title = "SEO",
  description = "Control how this page appears on search engines and social share previews.",
  siteName,
  previewPath,
}: SeoFieldsBlockProps) {
  const seo: SeoData = value ?? {};
  const metaTitle = (seo.metaTitle ?? "") as string;
  const metaDescription = (seo.metaDescription ?? "") as string;

  const update = (patch: Partial<SeoData>) => {
    onChange({ ...seo, ...patch });
  };

  const previewUrl = [siteName, previewPath].filter(Boolean).join(" › ");

  return (
    <Card data-testid="seo-fields-block">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/10">
            <Search className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meta title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="seo-meta-title" className="text-sm font-medium">
              Meta title
            </Label>
            <span
              className={`text-xs tabular-nums ${
                metaTitle.length > TITLE_MAX
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {metaTitle.length}/{TITLE_MAX}
            </span>
          </div>
          <Input
            id="seo-meta-title"
            value={metaTitle}
            onChange={(e) => update({ metaTitle: e.target.value })}
            placeholder={`e.g. Best ${entityLabel} — Buy now`}
            data-testid="seo-meta-title-input"
          />
        </div>

        {/* Meta description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="seo-meta-description"
              className="text-sm font-medium"
            >
              Meta description
            </Label>
            <span
              className={`text-xs tabular-nums ${
                metaDescription.length > DESC_MAX
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {metaDescription.length}/{DESC_MAX}
            </span>
          </div>
          <Textarea
            id="seo-meta-description"
            value={metaDescription}
            onChange={(e) => update({ metaDescription: e.target.value })}
            placeholder={`A short summary of this ${entityLabel} shown on search results.`}
            rows={3}
            data-testid="seo-meta-description-input"
          />
        </div>

        {/* Placeholder — future fields can slot in here.
            Kept as a marked region so imports elsewhere stay stable. */}
        {/* <ExtendedSeoFields ... />  ← reserved */}

        {/* Search snippet preview */}
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            Search preview
          </p>
          {previewUrl && (
            <p className="text-xs text-emerald-700 truncate">{previewUrl}</p>
          )}
          <p className="text-[15px] leading-snug text-blue-700 truncate mt-0.5">
            {metaTitle || `Untitled ${entityLabel}`}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {metaDescription ||
              `Your ${entityLabel} description will appear here once you add one.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default SeoFieldsBlock;
