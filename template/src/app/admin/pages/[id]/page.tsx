"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Page } from "@/src/components/admin/Cms";
import { PageEditor } from "@/src/components/admin/pages/page-editor";
import { pageService } from "@/src/services/PageServices";

export default function AdminPageEditorRoute() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [homepagePageId, setHomepagePageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        const [pageRes, pagesRes, settingsRes] = await Promise.all([
          pageService.getById(Number(params.id)),
          pageService.getAll(),
          fetch("/api/setting"),
        ]);
        const settingsJson = await settingsRes.json();
        setPage(pageRes.data?.data || pageRes.data || pageRes);
        setPages(pagesRes.data || []);
        setHomepagePageId(settingsJson.data?.homepagePageId ?? null);
      } catch (err: any) {
        setError(err?.message || "Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadPage();
  }, [params.id]);

  const handleSave = async (pageToSave?: Page) => {
    const nextPage = pageToSave || page;
    if (!nextPage) return;

    const updated = await pageService.update(Number(nextPage.id), nextPage);
    setPage(updated.data?.data || updated.data || updated);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading page...
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Page unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || "The requested page could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageEditor
      page={page}
      pages={pages}
      homepagePageId={homepagePageId}
      onChange={setPage}
      onSave={handleSave}
      onCancel={() => router.push("/admin")}
    />
  );
}
