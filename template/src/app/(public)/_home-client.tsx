"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query-key";
import { fetchers } from "@/src/lib/fetchers";
import { FORM_CSS } from "@/src/lib/form-renderer";
import { submitCmsForm } from "@/src/lib/form-submit-handler";
import Link from "next/link";
import { SchemaRenderer } from "../../components/admin/pages/SchemaOutput";
import { processPublicPageHtml } from "@/src/lib/public-page-html";
import { getApiBaseUrl } from "@/src/lib/axios";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string | null;
  publishedAt?: string | null;
  categories?: { id: string; name: string; slug: string }[];
  tags?: { id: string; name: string; slug: string }[];
}

const DEFAULT_FOOTER_SETTINGS = {
  footerLogo: "",
  footerBrandTitle: "",
  footerDescription: "",
  footerAddress: "",
  footerEmail: "",
  footerCopyright: "",
  socialLinks: [],
};

// Skeleton Components
const PostCardSkeleton = () => (
  <article className="border border-gray-200 rounded-xl overflow-hidden flex flex-col animate-pulse">
    <div className="w-full h-48 bg-gray-200" />
    <div className="p-5 flex flex-col flex-1">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="h-6 bg-gray-200 rounded mb-2 w-3/4" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-3 bg-gray-200 rounded w-12" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    </div>
  </article>
);

const PostsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {[...Array(6)].map((_, i) => (
      <PostCardSkeleton key={i} />
    ))}
  </div>
);

export default function PostsListPage({
  initialProcessedHtml = "",
  initialHasForms = false,
}: {
  initialProcessedHtml?: string;
  initialHasForms?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: queryKeys.posts,
    queryFn: fetchers.publicPosts,
    staleTime: 60_000,
  });

  const bootstrapData = queryClient.getQueryData<any>(["public", "bootstrap"]);

  const homepage = useMemo(
    () => bootstrapData?.data?.homepage,
    [bootstrapData],
  );

  const homepageId = useMemo(
    () => (homepage?.type === "page" ? homepage?.pageId : null),
    [homepage],
  );

  const page = useMemo(() => homepage?.page ?? null, [homepage]);
  const latestPosts = useMemo(() => {
    if (homepageId) return [];
    return postsData?.data ?? [];
  }, [postsData, homepageId]);

  const [processedPageHtml, setProcessedPageHtml] =
    useState(initialProcessedHtml);
  const [hasForms, setHasForms] = useState(initialHasForms);

  // CSS injection handled inline in the page render to avoid flicker

  // ── 7. Inject homepage page JS ──
  useEffect(() => {
    if (!page?.js) return;
    const script = document.createElement("script");
    script.id = `page-js-${page.id}`;
    script.textContent = page.js;
    document.body.appendChild(script);
    return () => script.remove();
  }, [page?.id, page?.js]);

  // ── 8. Intercept internal links inside page HTML ──
  useEffect(() => {
    const main = document.querySelector("main[data-page-content]");
    if (!main) return;
    const handler = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const a = (mouseEvent.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (href?.startsWith("/")) {
        e.preventDefault();
        router.push(href);
      }
    };
    main.addEventListener("click", handler);
    return () => main.removeEventListener("click", handler);
  }, [page?.id, router]);

  // ── prefetch internal page links on hover ──
  useEffect(() => {
    const main = document.querySelector("main[data-page-content]");
    if (!main) return;

    const prefetched = new Set<string>();

    const handler = (event: Event) => {
      const a = (event.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href?.startsWith("/")) return;

      const slug = href.replace(/^\/+/, "");
      if (!slug || prefetched.has(slug)) return;
      prefetched.add(slug);

      queryClient.prefetchQuery({
        queryKey: queryKeys.page(slug),
        queryFn: () => fetchers.publicPageBySlug(slug),
        staleTime: 1000 * 60 * 5,
      });
    };

    main.addEventListener("mouseover", handler);
    return () => main.removeEventListener("mouseover", handler);
  }, [page?.id, queryClient]);

  useEffect(() => {
    if (!processedPageHtml || !hasForms) return;

    const main = document.querySelector("main[data-page-content]");
    if (!main) return;

    const ac = new AbortController();
    const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

    main.addEventListener(
      "submit",
      async (e) => {
        const form = (e.target as HTMLElement).closest(
          ".cms-form",
        ) as HTMLFormElement;
        if (!form) return;

        e.preventDefault();
        e.stopPropagation();

        let valid = true;
        form.querySelectorAll("[required]").forEach((el: any) => {
          const err = el
            .closest(".cms-field-wrap")
            ?.querySelector(".cms-field-error");
          const empty = el.type === "checkbox" ? !el.checked : !el.value.trim();
          if (empty) {
            valid = false;
            el.classList.add("cms-field-invalid");
            if (err) err.textContent = "This field is required.";
          } else {
            el.classList.remove("cms-field-invalid");
            if (err) err.textContent = "";
          }
        });
        if (!valid) return;

        const submitBtn =
          form.querySelector<HTMLButtonElement>(".cms-form-submit");
        const originalLabel = submitBtn?.textContent ?? "Submit";
        const statusEl = form.querySelector<HTMLElement>(".cms-form-status");

        const setStatus = (type: string, msg: string) => {
          if (!statusEl) return;
          statusEl.classList.remove(
            "cms-form-status--loading",
            "cms-form-status--success",
            "cms-form-status--error",
          );
          if (type) statusEl.classList.add(`cms-form-status--${type}`);
          statusEl.textContent = msg;
        };

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending…";
        }
        setStatus("loading", "Sending…");

        try {
          const { ok, json } = await submitCmsForm(form, apiPath);

          if (ok && json.success !== false) {
            const redirect = form.dataset.redirect;
            if (redirect) {
              window.location.href = redirect;
              return;
            }

            const msg =
              form.dataset.confirmMessage ||
              "Thank you! Your message has been received.";
            const fieldsEl =
              form.querySelector<HTMLElement>(".cms-form-fields");
            const footerEl =
              form.querySelector<HTMLElement>(".cms-form-footer");
            if (fieldsEl) fieldsEl.style.display = "none";
            if (footerEl) footerEl.style.display = "none";
            setStatus("success", msg);

            setTimeout(() => {
              form.reset();
              form.querySelectorAll(".cms-field-error").forEach((el) => {
                el.textContent = "";
              });
              form.querySelectorAll(".cms-field-invalid").forEach((el) => {
                el.classList.remove("cms-field-invalid");
              });
              setStatus("", "");
              if (fieldsEl) fieldsEl.style.display = "";
              if (footerEl) footerEl.style.display = "";
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalLabel;
              }
            }, 3000);
          } else {
            const errMsg =
              json.message?.length < 200
                ? json.message
                : "Something went wrong.";
            setStatus("error", errMsg);
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalLabel;
            }
          }
        } catch {
          setStatus("error", "Network error. Please try again.");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          }
        }
      },
      { signal: ac.signal },
    );

    main.addEventListener(
      "input",
      (e) => {
        const el = e.target as HTMLElement;
        if (
          !el.matches(".cms-form input, .cms-form textarea, .cms-form select")
        )
          return;
        el.classList.remove("cms-field-invalid");
        const err = el
          .closest(".cms-field-wrap")
          ?.querySelector(".cms-field-error");
        if (err) err.textContent = "";
      },
      { signal: ac.signal },
    );

    return () => ac.abort();
  }, [processedPageHtml, hasForms, router]);

  useEffect(() => {
    if (!hasForms) return;
    const style = document.createElement("style");
    style.id = "form-css";
    style.textContent = FORM_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, [hasForms]);

  // ── 9. Loading gate ──
  const isPostsLoading = postsLoading;

  const breadcrumbSettings = useMemo(
    () => bootstrapData?.data?.breadcrumbSettings,
    [bootstrapData],
  );

  useEffect(() => {
    if (!page?.html || initialProcessedHtml) {
      if (!page?.html && !initialProcessedHtml) setProcessedPageHtml("");
      return;
    }

    let cancelled = false;

    const run = async () => {
      const { html, hasForms } = await processPublicPageHtml(page.html, {
        breadcrumbItems: [],
        breadcrumbSettings,
        context: {
          isHome: true,
          is404: false,
          isSearch: false,
        },
      });

      if (!cancelled) {
        setProcessedPageHtml(html);
        setHasForms(hasForms);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [page?.html, breadcrumbSettings, initialProcessedHtml]);

  // ── 10. Homepage is a static page ──
  if (page) {
    return (
      <>
        {page?.css && <style id={`page-css-${page.id}`}>{page.css}</style>}
        <SchemaRenderer seoData={page?.seoData} />
        <main
          data-page-content
          className="flex-1"
          dangerouslySetInnerHTML={{ __html: processedPageHtml }}
        />
      </>
    );
  }

  // ── 11. Homepage is posts list ──
  return (
    <>
      <header className="bg-gray-50 border-b border-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900">Posts</h1>
          {!isPostsLoading && (
            <p className="text-gray-500 mt-1">
              {latestPosts.length} published post
              {latestPosts.length !== 1 ? "s" : ""}
            </p>
          )}
          {isPostsLoading && (
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mt-1" />
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-12 pb-16">
        {isPostsLoading ? (
          <PostsGridSkeleton />
        ) : latestPosts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>No posts published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestPosts.map((post: Post) => (
              <article
                key={post.id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col cursor-pointer group"
              >
                {post.featuredImage && (
                  <a
                    href={`/posts/${post.slug}`}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      router.push(`/posts/${post.slug}`);
                    }}
                    className="overflow-hidden"
                  >
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </a>
                )}
                <div className="p-5 flex flex-col flex-1">
                  {post.categories && post.categories.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {post.categories.map((c) => (
                        <span
                          key={c.id}
                          className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                    <a
                      href={`/posts/${post.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/posts/${post.slug}`);
                      }}
                      className="hover:text-gray-700 transition-colors"
                    >
                      {post.title}
                    </a>
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 flex-1 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    {post.publishedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(post.publishedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    )}
                    <Link
                      href={`/posts/${post.slug}`}
                      className="text-sm font-semibold text-gray-900 hover:underline"
                      onMouseEnter={() => {
                        queryClient.prefetchQuery({
                          queryKey: queryKeys.post(post.slug),
                          queryFn: () => fetchers.post(post.slug),
                          staleTime: 1000 * 60 * 5,
                        });
                      }}
                    >
                      Read more →
                    </Link>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.tags.map((t) => (
                        <span key={t.id} className="text-xs text-gray-400">
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
