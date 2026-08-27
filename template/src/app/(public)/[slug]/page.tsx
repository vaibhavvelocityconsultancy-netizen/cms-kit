import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import SlugClient from "./_slug-client";
import { queryKeys } from "@/src/lib/query-key";
import { fetchers } from "@/src/lib/fetchers";
import { log404Error } from "@/src/lib/redirectMiddleware";
import { SchemaRenderer } from "@/src/components/admin/pages/SchemaOutput";
import { processPublicPageHtml } from "@/src/lib/public-page-html";
import { enrichHtmlWithMediaDimensions } from "@/src/lib/media-dimensions.server";
import { resolveSeoTemplate, resolveSeoTitle } from "@/src/lib/seo-template";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const [result, bootstrapResult] = await Promise.all([
      fetchers.publicPageBySlug(slug),
      fetchers.publicBootstrap(),
    ]);
    const page = result?.data;

    if (!page) return {};

    const settings = bootstrapResult?.data?.settings;
    const seo = page?.seoData || {};
    const title = resolveSeoTitle(seo, {
      title: page?.title,
      page: page?.title,
      separator: seo.separator,
      siteName: settings?.siteName,
    });
    const description = seo.metaDescription || undefined;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://next-crm-momemtums.vercel.app");

    const canonical =
      seo.canonicalUrl || `${siteUrl}${slug === "home" ? "" : `/${slug}`}`;

    return {
      title,
      description,
      alternates: { canonical },
      robots: {
        index: seo.robotsIndex ?? true,
        follow: seo.robotsFollow ?? true,
        noarchive: seo.robotsNoArchive || undefined,
        nosnippet: seo.robotsNoSnippet || undefined,
        noimageindex: seo.robotsNoImageIndex || undefined,
        "max-snippet": seo.maxSnippet ?? -1,
        "max-video-preview": seo.maxVideoPreview ?? -1,
        "max-image-preview": seo.maxImagePreview || "large",
      },
      openGraph: {
        title: seo.ogTitle
          ? resolveSeoTemplate(seo.ogTitle, {
              title: page?.title,
              page: page?.title,
              separator: seo.separator,
              siteName: settings?.siteName,
            })
          : title,
        description: seo.ogDescription || description,
        images: seo.ogImage ? [seo.ogImage] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: resolveSeoTemplate(seo.twitterTitle || seo.ogTitle || title, {
          title: page?.title,
          page: page?.title,
          separator: seo.separator,
          siteName: settings?.siteName,
        }),
        description: seo.twitterDescription || seo.ogDescription || description,
        images:
          seo.twitterImage || seo.ogImage
            ? [seo.twitterImage || seo.ogImage]
            : undefined,
      },
    };
  } catch (error) {
    return {};
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const queryClient = new QueryClient();

  try {
    const [, pageResult] = await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["public", "bootstrap"],
        queryFn: () => fetchers.publicBootstrap(),
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.page(slug),
        queryFn: () => fetchers.publicPageBySlug(slug),
      }),
    ]);

    const page = pageResult?.data;

    if (!pageResult?.success || !pageResult?.data) {
      try {
        await log404Error(`/public/${slug}`, undefined, "");
      } catch (error) {
        console.error("Failed to log 404:", error);
      }
      notFound();
    }

    const seoData = page.seoData || {};

    if (seoData.redirectEnabled && seoData.redirectUrl) {
      redirect(seoData.redirectUrl);
    }

    // ── process page HTML server-side ──
    const bootstrapData = queryClient.getQueryData<any>([
      "public",
      "bootstrap",
    ]);
    const breadcrumbSettings = bootstrapData?.data?.breadcrumbSettings;

    let initialProcessedHtml = "";
    let initialHasForms = false;

    try {
      const serverBaseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : `http://localhost:3000`);

      const { html, hasForms } = await processPublicPageHtml(page.html, {
        breadcrumbItems: [
          { label: page.title || "Page", href: `/${page.slug ?? ""}` },
        ],
        breadcrumbSettings,
        baseUrl: serverBaseUrl,
        context: { isHome: false, is404: false, isSearch: false },
      });
      initialProcessedHtml = await enrichHtmlWithMediaDimensions(html);
      initialHasForms = hasForms;
    } catch (error) {
      console.error("Server-side page HTML processing failed:", error);
    }

    return (
      <>
        {/* <SchemaRenderer seoData={seoData} /> */}
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SlugClient
            initialProcessedHtml={initialProcessedHtml}
            initialHasForms={initialHasForms}
          />
        </HydrationBoundary>
      </>
    );
  } catch (error) {
    notFound();
  }
}
