"use client";

import { useParams } from "next/navigation";
import { getBaseUrl } from "@/src/lib/config";
import { appUrl } from "@/src/lib/base-path";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/src/ui/card";

type MarkdownData = {
  body: string;
  metadata: Record<string, string>;
};

function parseMarkdownData(content: string): MarkdownData {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return { body: content, metadata: {} };
  }

  const metadata: Record<string, string> = {};

  match[1].split(/\r?\n/).forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return;

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    try {
      metadata[key] = JSON.parse(rawValue);
    } catch {
      metadata[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  });

  return {
    body: content.slice(match[0].length),
    metadata,
  };
}

export default function LlmsPage() {
  const params = useParams();
  const slug = (params?.slug as string | undefined) ?? "";

  const {
    data: content,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-llms", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/public/llms/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.text();
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="mx-auto mt-10 max-w-4xl p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Markdown file not found: /{slug}.md</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { body, metadata } = parseMarkdownData(content);
  const rawUrl = appUrl(`/${slug}.md`);
  const metaTitle = metadata.metaTitle || metadata.title || slug;
  const metaDescription = metadata.metaDescription || "";
  const canonicalUrl = metadata.url || rawUrl;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-8 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
              <FileText className="h-4 w-4" />
              <span>AI markdown preview</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              {metaTitle}
            </h1>
            {metaDescription && (
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                {metaDescription}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
              {metadata.type && (
                <span className="rounded border border-slate-200 bg-slate-100 px-2.5 py-1">
                  {metadata.type}
                </span>
              )}
              {metadata.updated && (
                <span className="rounded border border-slate-200 bg-slate-100 px-2.5 py-1">
                  Updated {metadata.updated}
                </span>
              )}
              <span className="rounded border border-slate-200 bg-slate-100 px-2.5 py-1">
                {canonicalUrl}
              </span>
            </div>
          </div>
          <a
            href={rawUrl}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Raw .md
          </a>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Card className="rounded-lg border-slate-200 shadow-sm">
          <CardContent className="pt-8">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ ...props }) => (
                    <h1
                      className="mb-4 mt-0 scroll-mt-20 text-3xl font-semibold tracking-normal text-slate-950"
                      {...props}
                    />
                  ),
                  h2: ({ ...props }) => (
                    <h2
                      className="mb-3 mt-7 scroll-mt-20 text-2xl font-semibold tracking-normal text-slate-900"
                      {...props}
                    />
                  ),
                  h3: ({ ...props }) => (
                    <h3
                      className="mb-2 mt-5 scroll-mt-20 text-xl font-semibold tracking-normal text-slate-900"
                      {...props}
                    />
                  ),
                  p: ({ ...props }) => (
                    <p
                      className="mb-4 text-base leading-8 text-slate-700"
                      {...props}
                    />
                  ),
                  strong: ({ ...props }) => (
                    <strong className="font-bold" {...props} />
                  ),
                  em: ({ ...props }) => <em className="italic" {...props} />,
                  code: ({ inline, ...props }) =>
                    inline ? (
                      <code
                        className="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-red-600"
                        {...props}
                      />
                    ) : (
                      <code
                        className="mb-4 block overflow-x-auto rounded bg-gray-900 p-4 font-mono text-sm text-gray-100"
                        {...props}
                      />
                    ),
                  pre: ({ ...props }) => (
                    <pre
                      className="mb-4 overflow-x-auto rounded bg-gray-900 p-4 text-gray-100"
                      {...props}
                    />
                  ),
                  ul: ({ ...props }) => (
                    <ul className="mb-4 ml-4 list-disc space-y-2" {...props} />
                  ),
                  ol: ({ ...props }) => (
                    <ol
                      className="mb-4 ml-4 list-decimal space-y-2"
                      {...props}
                    />
                  ),
                  li: ({ ...props }) => <li className="mb-2" {...props} />,
                  blockquote: ({ ...props }) => (
                    <blockquote
                      className="my-4 border-l-4 border-gray-400 bg-gray-50 py-2 pl-4 italic text-gray-700"
                      {...props}
                    />
                  ),
                  a: ({ ...props }) => (
                    <a
                      className="text-blue-700 hover:text-blue-900 hover:underline"
                      {...props}
                    />
                  ),
                  hr: ({ ...props }) => (
                    <hr className="my-8 border-gray-300" {...props} />
                  ),
                  table: ({ ...props }) => (
                    <div className="mb-4 overflow-x-auto">
                      <table
                        className="w-full border-collapse border border-gray-300"
                        {...props}
                      />
                    </div>
                  ),
                  thead: ({ ...props }) => (
                    <thead className="bg-gray-200" {...props} />
                  ),
                  tbody: ({ ...props }) => <tbody {...props} />,
                  tr: ({ ...props }) => (
                    <tr className="border-b border-gray-300" {...props} />
                  ),
                  td: ({ ...props }) => (
                    <td
                      className="border border-gray-300 px-4 py-2"
                      {...props}
                    />
                  ),
                  th: ({ ...props }) => (
                    <th
                      className="border border-gray-300 px-4 py-2 text-left font-bold"
                      {...props}
                    />
                  ),
                }}
              >
                {body}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
