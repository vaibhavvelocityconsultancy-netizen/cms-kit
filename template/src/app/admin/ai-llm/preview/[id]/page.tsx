"use client";

import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/src/lib/config";
import { Button } from "@/src/ui/button";
import { Loader2, Download, ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/src/ui/use-toast";
import Link from "next/link";
import { useParams } from "next/navigation";

type AICrawlContentDetail = {
  id: number;
  contentType: "page" | "post";
  slug: string;
  title: string;
  wordCount: number;
  updatedAt: string;
  markdown: string;
};

export default function PreviewPage() {
  const { toast } = useToast();
  const params = useParams();
  const id = params?.id as string;

  const [copied, setCopied] = useState(false);

  // Fetch content
  const {
    data: content,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ai-crawl-content", id],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/ai-crawl-content/${id}`);
      if (!res.ok) throw new Error("Failed to fetch content");
      const json = await res.json();
      return json.data as AICrawlContentDetail;
    },
    enabled: !!id,
  });

  const handleDownload = () => {
    if (!content) return;

    const element = document.createElement("a");
    const file = new Blob([content.markdown], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${content.slug}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
    toast({
      title: `${content.title}.md downloaded`,
    });
  };

  const handleCopy = () => {
    if (!content) return;

    navigator.clipboard.writeText(content.markdown);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <p className="text-red-800">Failed to load content</p>
          <Link href="/admin">
            <Button className="mt-4">Go Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {content.slug}.md
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              onClick={handleDownload}
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Raw Markdown Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <pre className="p-6 overflow-x-auto text-sm leading-6 text-gray-900 dark:text-gray-100 font-mono">
            <code>{content.markdown}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
