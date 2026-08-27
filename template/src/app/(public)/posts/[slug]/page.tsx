"use client";

import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/src/hooks/use-current-user";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query-key";
import { fetchers } from "@/src/lib/fetchers";
import { getBaseUrl } from "@/src/lib/config";
import {
  DEFAULT_BREADCRUMB_SETTINGS,
  injectBreadcrumb,
  renderBreadcrumbHtml,
} from "@/src/lib/shortcode/renderBreadcrumbHtml";
interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorUrl?: string;
  parentId?: string | null;
  createdAt: string;
  replies?: Comment[];
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string | null;
  publishedAt?: string | null;
  categories?: { id: string; name: string; slug: string }[];
  tags?: { id: string; name: string; slug: string }[];
  seoData?: any;
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

export default function PublicPostPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const slug = params.slug;

  // ── state ──
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    url: "",
    content: "",
  });
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error" | "pending" | null;
    msg: string;
  }>({ type: null, msg: "" });
  const [submitting, setSubmitting] = useState(false);

  // ── queries ──
  const [
    { data: settingsData, isLoading: settingsLoading },
    { data: cssData },
    { data: footerData },
    { data: menusData, isLoading: menusLoading },
    { data: postData, isLoading: postLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: queryKeys.settings,
        queryFn: fetchers.publicSettings,
        staleTime: Infinity,
      },
      {
        queryKey: queryKeys.globalCss,
        queryFn: fetchers.globalCss,
        staleTime: Infinity,
      },
      {
        queryKey: queryKeys.footerSettings,
        queryFn: fetchers.publicFooterSettings,
        staleTime: Infinity,
      },
      {
        queryKey: queryKeys.menus,
        queryFn: fetchers.publicMenus,
        staleTime: Infinity,
      },
      {
        queryKey: queryKeys.post(slug),
        queryFn: () => fetchers.post(slug),
        enabled: !!slug,
        staleTime: 0,
      },
    ],
  });

  const { data: bootstrapData } = useQuery({
    queryKey: ["public", "bootstrap"],
    queryFn: fetchers.publicBootstrap,
    staleTime: 60_000,
  });

  // ── derived ──
  const settings = useMemo(() => settingsData?.data, [settingsData]);
  const globalCss = useMemo(() => cssData?.data?.css || "", [cssData]);
  const footerSettings = useMemo(() => footerData?.data ?? {}, [footerData]);
  const allMenus = useMemo(() => menusData?.data ?? [], [menusData]);
  const footerMenus = useMemo(
    () => allMenus.filter((m: any) => m.location === "footer"),
    [allMenus],
  );
  const post = useMemo(() => postData?.data ?? null, [postData]);
  const breadcrumbSettings = useMemo(
    () => bootstrapData?.data?.breadcrumbSettings,
    [bootstrapData],
  );

  const { data: postsListPageData } = useQuery({
    queryKey: queryKeys.pageById(settingsData?.data?.postsPageId ?? ""),
    queryFn: () => fetchers.pageById(settingsData?.data?.postsPageId),
    enabled: !!settingsData?.data?.postsPageId,
    staleTime: 60_000,
  });

  const postsListPage = useMemo(
    () => postsListPageData?.data ?? null,
    [postsListPageData],
  );

  const headerMenu = useMemo(
    () => allMenus.find((m: any) => m.location === "header"),
    [allMenus],
  );

  const footer = useMemo(
    () => ({
      ...DEFAULT_FOOTER_SETTINGS,
      ...footerSettings,
      footerBrandTitle:
        footerSettings.footerBrandTitle || settings?.siteName || "My Website",
      footerCopyright:
        footerSettings.footerCopyright ||
        `© ${new Date().getFullYear()} ${settings?.siteName}. All rights reserved.`,
    }),
    [footerSettings, settings],
  );

  // ── fetch comments ──
  const fetchComments = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/posts/${postId}/comments`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setComments(list);
      const countAll = (arr: Comment[]): number =>
        arr.reduce((acc, c) => acc + 1 + countAll(c.replies ?? []), 0);
      setCommentCount(countAll(list));
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  }, []);

  useEffect(() => {
    if (post?.id) fetchComments(post.id);
  }, [post?.id, fetchComments]);

  // ── inject global CSS ──
  useEffect(() => {
    if (!globalCss) return;
    const style = document.createElement("style");
    style.id = "global-cms-css";
    style.textContent = globalCss;
    document.head.appendChild(style);
    return () => style.remove();
  }, [globalCss]);

  // ── submit comment ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    if (!formData.name || !formData.email || !formData.content) {
      setFormStatus({
        type: "error",
        msg: "Name, email and comment are required.",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormStatus({
        type: "error",
        msg: "Please enter a valid email address.",
      });
      return;
    }

    setSubmitting(true);
    setFormStatus({ type: null, msg: "" });

    try {
      const res = await fetch(`${getBaseUrl()}/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: formData.name,
          authorEmail: formData.email,
          authorUrl: formData.url || null,
          content: formData.content,
          parentId: replyingTo?.id || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        await fetchComments(post.id);
        setFormData({ name: "", email: "", url: "", content: "" });
        setReplyingTo(null);
        setFormStatus({
          type: data.status === "APPROVED" ? "success" : "pending",
          msg:
            data.status === "APPROVED"
              ? "✅ Your comment has been posted!"
              : "✅ Your comment is awaiting moderation.",
        });
      } else {
        setFormStatus({
          type: "error",
          msg: data.error || "Failed to submit.",
        });
      }
    } catch {
      setFormStatus({
        type: "error",
        msg: "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── loading ──
  // breadcrumb rendered as its own block — kept OUT of prose content
  const postBreadcrumbHtml = useMemo(() => {
    if (
      !breadcrumbSettings?.enabled ||
      !postsListPage?.html?.includes("[breadcrumb]")
    )
      return "";
    return renderBreadcrumbHtml(
      [
        { label: "Posts", href: "newweb/posts" },
        {
          label: post?.title || "Post",
          href: `newweb/posts/${post?.slug ?? ""}`,
        },
      ],
      breadcrumbSettings ?? DEFAULT_BREADCRUMB_SETTINGS,
    );
  }, [postsListPage?.html, post?.title, post?.slug, breadcrumbSettings]);
  // post body content — supports [breadcrumb] shortcode if an author types it inline,
  // but won't auto-inject (since we already render it separately above)
  const processedPostContent = useMemo(() => {
    if (!post?.content) return "";
    if (!post.content.includes("[breadcrumb]")) return post.content;

    return injectBreadcrumb(
      post.content,
      [
        { label: settings?.homeLabel || "Home", href: "newweb" },
        { label: "Posts", href: "newweb/posts" },
        { label: post.title, href: `newweb/posts/${post.slug}` },
      ],
      breadcrumbSettings,
      { isHome: false, is404: false, isSearch: false },
    );
  }, [post?.content, post?.title, post?.slug, settings, breadcrumbSettings]);
  const isLoading =
    (!settings || !post) && (settingsLoading || menusLoading || postLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-600">
        Loading...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <p className="mt-3 text-lg text-gray-600">
            Post not found: /posts/{slug}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const commentLabel =
    commentCount === 0
      ? "No Comments"
      : `${commentCount} Comment${commentCount !== 1 ? "s" : ""}`;

  // ── render comment tree ──
  const renderComments = (list: Comment[], depth = 0): React.ReactNode =>
    list.map((c) => {
      const initials = c.authorName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const colors = [
        "#3b82f6",
        "#8b5cf6",
        "#10b981",
        "#f59e0b",
        "#ec4899",
        "#6366f1",
      ];
      let hash = 0;
      for (let i = 0; i < c.authorName.length; i++)
        hash += c.authorName.charCodeAt(i);
      const color = colors[hash % colors.length];
      const seconds = Math.floor(
        (Date.now() - new Date(c.createdAt).getTime()) / 1000,
      );
      const timeAgo =
        seconds < 60
          ? "just now"
          : seconds < 3600
            ? `${Math.floor(seconds / 60)}m ago`
            : seconds < 86400
              ? `${Math.floor(seconds / 3600)}h ago`
              : `${Math.floor(seconds / 86400)}d ago`;

      return (
        <div key={c.id} className="flex gap-3 py-3">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: color }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              {c.authorUrl ? (
                <a
                  href={c.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-semibold text-sm text-blue-600 hover:underline"
                >
                  {c.authorName}
                </a>
              ) : (
                <span className="font-semibold text-sm text-gray-900">
                  {c.authorName}
                </span>
              )}
              <span className="text-xs text-gray-400">{timeAgo}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {c.content}
            </p>
            {depth < 3 && (
              <button
                onClick={() =>
                  setReplyingTo(
                    replyingTo?.id === c.id
                      ? null
                      : { id: c.id, name: c.authorName },
                  )
                }
                className="mt-1 text-xs text-gray-500 hover:text-blue-600"
              >
                ↩ Reply
              </button>
            )}
            {replyingTo?.id === c.id && (
              <div className="mt-3">
                <CommentForm
                  replyingTo={replyingTo}
                  formData={formData}
                  setFormData={setFormData}
                  formStatus={formStatus}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                  onCancel={() => setReplyingTo(null)}
                />
              </div>
            )}
            {c.replies && c.replies.length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-gray-100">
                {renderComments(c.replies, depth + 1)}
              </div>
            )}
          </div>
        </div>
      );
    });

  return (
    <div className="min-h-screen flex flex-col">
      <>
        <main className="flex-1 w-full max-w-[740px] mx-auto px-4 py-12 pb-16">
          {postBreadcrumbHtml && (
            <div dangerouslySetInnerHTML={{ __html: postBreadcrumbHtml }} />
          )}

          {/* categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((c: any) => (
                <a
                  key={c.id}
                  href={`/posts?category=${c.slug}`}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    router.push(`/posts?category=${c.slug}`);
                  }}
                  className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full uppercase tracking-wide hover:bg-gray-200"
                >
                  {c.name}
                </a>
              ))}
            </div>
          )}

          {/* title */}
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
            {post.title}
          </h1>

          {/* meta */}
          {publishedDate && (
            <div className="text-sm text-gray-500 mb-8 pb-6 border-b border-gray-200">
              {publishedDate}
            </div>
          )}
          {/* breadcrumb — own block, outside prose so it isn't styled by the typography plugin */}

          {/* featured image */}
          {post.featuredImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-auto max-h-[480px] object-cover"
              />
            </div>
          )}

          {/* content — page builder HTML */}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: processedPostContent }}
          />

          {/* tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-gray-200">
              {post.tags.map((t: any) => (
                <a
                  key={t.id}
                  href={`/posts?tag=${t.slug}`}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    router.push(`/posts?tag=${t.slug}`);
                  }}
                  className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full hover:bg-gray-200 hover:text-gray-800"
                >
                  #{t.name}
                </a>
              ))}
            </div>
          )}

          {/* comments */}
          <section className="mt-12 pt-10 border-t-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-8">
              {commentLabel}
            </h2>
            <div className="divide-y divide-gray-100">
              {renderComments(comments)}
            </div>

            {/* main comment form — only show if not replying to a specific comment */}
            {!replyingTo && (
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-5">
                  Leave a Comment
                </h3>
                <CommentForm
                  replyingTo={null}
                  formData={formData}
                  setFormData={setFormData}
                  formStatus={formStatus}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                  onCancel={null}
                />
              </div>
            )}
          </section>
        </main>
      </>

      {/* // <SiteFooter footer={footer} footerMenus={footerMenus} /> */}
    </div>
  );
}

// ── Separate CommentForm component ──────────────────────────

function CommentForm({
  replyingTo,
  formData,
  setFormData,
  formStatus,
  submitting,
  onSubmit,
  onCancel,
}: {
  replyingTo: { id: string; name: string } | null;
  formData: { name: string; email: string; url: string; content: string };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      url: string;
      content: string;
    }>
  >;
  formStatus: { type: string | null; msg: string };
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: (() => void) | null;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {replyingTo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
          Replying to <strong>{replyingTo.name}</strong>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Your name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((p) => ({ ...p, email: e.target.value }))
            }
            placeholder="your@email.com"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Website</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
          placeholder="https://"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Comment <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={5}
          value={formData.content}
          onChange={(e) =>
            setFormData((p) => ({ ...p, content: e.target.value }))
          }
          placeholder="Write your comment..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y min-h-[120px]"
        />
      </div>
      {formStatus.msg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            formStatus.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : formStatus.type === "pending"
                ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {formStatus.msg}
        </div>
      )}
      <div className="flex gap-3 items-center">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? "Posting..."
            : replyingTo
              ? "Post Reply"
              : "Post Comment"}
        </button>
      </div>
    </form>
  );
}
