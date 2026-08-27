"use client";

import { useState } from "react";
import { Page } from "../Cms";
import { PageEditorHeader } from "./PageEditorHeader";
import { PageEditorContent } from "./PageEditorContent";
import { PageEditorSidebar } from "./PageEditorSidebar";
import { SeoPanel } from "./seo-pannel";
// import { SeoPanel } from "./SeoPanel"; // Import the SEO panel

interface PageEditorProps {
  page: Page;
  pages: Page[];
  homepagePageId: number | null;
  onChange: (page: Page) => void;
  onSave: (pageToSave?: Page) => Promise<void>;
  onCancel: () => void;
}

// Extend the Page type to include SEO data if not already defined
interface PageWithSeo extends Page {
  seoData?: {
    metaTitle?: string;
    metaDescription?: string;
    titleTemplate?: string;
    seprator?: string;
    focusKeywords?: string[];
    isPillarContent?: boolean;
    canonicalUrl?: string;
    robotsIndex?: boolean;
    robotsFollow?: boolean;
    robotsNoImageIndex?: boolean; // NEW
    robotsNoArchive?: boolean; // NEW
    robotsNoSnippet?: boolean; // NEW
    maxSnippet?: number; // NEW
    maxVideoPreview?: number; // NEW
    maxImagePreview?: "none" | "standard" | "large"; // NEW
    breadcrumbTitle?: string; // NEW
    redirectEnabled?: boolean; // NEW
    redirectUrl?: string; // NEW
    schemaType?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
  };
}

export function PageEditor({
  page,
  pages,
  homepagePageId,
  onChange,
  onSave,
  onCancel,
}: PageEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(page);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    const updatedPage: Page = {
      ...page,
      status: "PUBLISHED",
    };

    onChange(updatedPage);

    setIsSaving(true);
    try {
      await onSave(updatedPage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeoChange = (seoData: any) => {
    onChange({
      ...page,
      seoData: seoData,
    });
  };

  return (
    <div className="flex flex-col bg-background font-sans">
      <PageEditorHeader
        page={page}
        homepagePageId={homepagePageId}
        onChange={onChange}
        onCancel={onCancel}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <div className="flex-1 p-6 max-w-375 w-full mx-auto">
        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <PageEditorContent page={page} onChange={onChange} />
          </div>
          <div className="w-95 shrink-0 flex flex-col gap-4">
            <PageEditorSidebar
              page={page}
              pages={pages}
              onChange={onChange}
              onSave={handleSave}
              onPublish={handlePublish}
              isSaving={isSaving}
            />
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            SEO Settings
          </h2>
          <SeoPanel
            pageTitle={page.title}
            pageSlug={page.slug}
            pageContent={page.html || ""}
            siteUrl={process.env.NEXT_PUBLIC_SITE_URL || "https://ipdav.com"}
            siteName={process.env.NEXT_PUBLIC_SITE_NAME || "Your Site"}
            initialData={(page as PageWithSeo).seoData}
            onChange={handleSeoChange}
            onSlugChange={(slug) => onChange({ ...page, slug })}
          />
        </div>
      </div>
    </div>
  );
}
