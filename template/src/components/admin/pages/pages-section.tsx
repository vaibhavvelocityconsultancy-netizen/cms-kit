"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Page } from "../Cms";
import { pageService } from "@/src/services/PageServices";
import { PageEditor } from "./page-editor";
import { Button } from "@/src/ui/button";
import { Column, DataTable } from "@/src/ui/data-table";
import { useBulkDelete } from "@/src/hooks/use-bulkdelete";
import { toast } from "@/src/hooks/use-toast";
import { useAdminSave } from "@/src/hooks/use-adminsave";
import { getApiBaseUrl } from "@/src/lib/axios";

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

async function readJsonResponse(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      text.trim().startsWith("<")
        ? `Request failed with a non-JSON response (${res.status})`
        : text || `Request failed (${res.status})`,
    );
  }

  return res.json();
}

export function PagesSection() {
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [homepagePageId, setHomepagePageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewPage, setIsNewPage] = useState(false);
  const { afterSavePage } = useAdminSave();
  const {
    selectedItems: selectedPages,
    setSelectedItems: setSelectedPages,
    deleteSelected,
    bulkDeleteLoading,
  } = useBulkDelete({
    setItems: setPages,
    bulkDeleteFn: pageService.bulkDelete,
  });
  // ── Export handler ──
  // Calls GET /api/export, receives the JSON payload,
  // then triggers a browser file download — no extra library needed
  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiPath("/api/export"));
      const json = await readJsonResponse(res);

      // json.data is the actual export payload (pages, menus, __meta etc.)
      const blob = new Blob([JSON.stringify(json.data, null, 2)], {
        type: "application/json",
      });

      // Create a temporary anchor, click it, then clean up
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cms-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your file is downloading.",
      });
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Export failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Import handler ──
  // Opens a hidden file input, reads the selected JSON file,
  // posts it to POST /api/import, then refreshes the page list
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setLoading(true);
        const text = await file.text();
        const data = JSON.parse(text);

        const res = await fetch(apiPath("/api/import"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // strategy: 'skip' means if a slug already exists, leave it alone
          // change to 'overwrite' or 'rename' based on your preference
          body: JSON.stringify({ data, strategy: "skip" }),
        });

        const json = await readJsonResponse(res);

        if (!res.ok) {
          throw new Error(json.message || "Import failed");
        }

        const report = json.data;

        // Refresh the pages list so newly imported pages appear
        await fetchPages();

        toast({
          title: "Import successful",
          description: `${report.pages.created} created, ${report.pages.skipped} skipped, ${report.pages.overwritten} overwritten.`,
        });
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Import failed", description: err.message });
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };
  const handleTogglePublish = async (page: Page) => {
    try {
      setLoading(true);
      const res =
        page.status === "PUBLISHED"
          ? await pageService.unpublish(Number(page.id))
          : await pageService.publish(Number(page.id));
      const updated = res.data?.data ?? res.data ?? res;
      setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast({
        title:
          page.status === "PUBLISHED" ? "Page unPUBLISHED" : "Page PUBLISHED",
        description:
          page.status === "PUBLISHED" ? "Page unPUBLISHED" : "Page PUBLISHED",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      setLoading(true);
      console.time("api");
      const res = await pageService.getById(id as any);
      console.timeEnd("api");
      const fullPage = res.data?.data || res.data;
      console.time("setEditing");
      setEditingPage(fullPage);
      console.timeEnd("setEditing");
      setIsNewPage(false);
    } catch (error) {
      console.error("Failed to fetch page:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      setLoading(true);
      const [res, settingsRes] = await Promise.all([
        pageService.getAll(),
        fetch(apiPath("/api/setting")),
      ]);
      const settingsJson = await readJsonResponse(settingsRes);
      setPages(res.data);
      setHomepagePageId(settingsJson.data?.homepagePageId ?? null);
      setError(null);
    } catch (error: any) {
      setError(error.message);
      console.error(error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const savePage = async (pageToSave?: Page) => {
    const finalPage = pageToSave || editingPage;
    if (!finalPage) return;

    try {
      setLoading(true);
      setError(null);

      let pageForValidation = finalPage;
      let createdPage: Page | null = null;

      if (isNewPage) {
        const createData = {
          title: finalPage.title,
          slug: finalPage.slug,
          html: finalPage.html,
          css: finalPage.css,
          js: finalPage.js,
          status: finalPage.status,
          seoData: finalPage.seoData,
        };

        const createRes = await pageService.create(createData);
        createdPage = createRes.data?.data || createRes.data;
        pageForValidation = {
          ...finalPage,
          ...createdPage,
          html: finalPage.html,
          css: finalPage.css,
          js: finalPage.js,
          seoData: finalPage.seoData,
          status: finalPage.status,
        };
      }

      // ── Step 1: Validate + convert HTML → JSX ──
      const validateRes = await fetch(
        apiPath(`/api/pages/${pageForValidation.id}/convert-jsx`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html: pageForValidation.html || "",
            save: false, // validate only first
          }),
        },
      );

      const validateData = await readJsonResponse(validateRes);
      const conversion = validateData.data ?? validateData;
      const conversionErrors = conversion.errors ?? validateData.errors ?? [];
      const conversionWarnings = conversion.warnings ?? [];
      const criticalWarnings = conversionWarnings
        .filter((w: any) => w.type === "critical")
        .map((w: any) => w.message);

      // ── Block if errors ──
      // ── Block if validation fails ──

      if (!validateRes.ok || conversion.success !== true) {
        const errorMessages = [
          ...conversionErrors,

          ...criticalWarnings,
          validateData.message,
        ].filter(Boolean);

        setError(
          `Cannot save — fix these issues first:\n\n${errorMessages.join("\n")}`,
        );

        return;
      }
      // ── Step 2: Save page with jsxCode ──
      const pageWithJsx = {
        id: pageForValidation.id,

        title: pageForValidation.title,

        slug: pageForValidation.slug,

        html: pageForValidation.html,

        css: pageForValidation.css,

        js: pageForValidation.js,

        status: pageForValidation.status,

        seoData: pageForValidation.seoData,

        jsxCode: conversion.jsxCode,

        pageType: "jsx",
      };
      let savedPage!: Page;

      if (isNewPage && createdPage) {
        const updateRes = await pageService.update(
          createdPage.id as any,
          pageWithJsx,
        );
        savedPage = updateRes.data?.data || updateRes.data;
        setPages((prev) => [...prev, savedPage]);
        afterSavePage(savedPage.slug);
        toast({
          title: "Page created",

          description:
            conversionWarnings.length > 0
              ? `Page created with ${conversionWarnings.length} warning${conversionWarnings.length > 1 ? "s" : ""}.`
              : "Page created and JSX converted successfully.",
        });
      } else {
        const res = await pageService.update(finalPage.id as any, pageWithJsx);
        savedPage = res.data?.data || res.data;
        setPages((prev) =>
          prev.map((p) => (p.id === finalPage.id ? savedPage : p)),
        );
        afterSavePage(savedPage.slug);
        if (finalPage.slug !== savedPage.slug) {
          afterSavePage(finalPage.slug);
        }

        toast({
          title: "Page updated",

          description:
            conversionWarnings.length > 0
              ? `Page updated with ${conversionWarnings.length} warning${conversionWarnings.length > 1 ? "s" : ""}.`
              : "Page updated and JSX converted successfully.",
        });
      }

      setEditingPage({
        ...savedPage,
        message: validateData.message,

        warnings: conversionWarnings,

        errors: conversionErrors,
      } as any);
      setIsNewPage(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to save page:", err);
    } finally {
      setLoading(false);
    }
  };

  const deletePage = async (id: string) => {
    try {
      setLoading(true);
      await pageService.delete(id as any);
      setPages(pages.filter((p) => p.id !== id));
      setDeleteConfirm(null);
      setError(null);
    } catch (error: any) {
      setError(error.message);
      console.error("Failed to delete page:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPage = () => {
    const tempPage: Page = {
      id: `temp-${Date.now()}`,
      title: "New Page",
      slug: "new-page",
      html: "",
      css: "",
      js: "",
      status: "DRAFT",
      modified: new Date().toISOString().split("T")[0],
    };
    setEditingPage(tempPage);
    setIsNewPage(true);
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const columns: Column<Page>[] = [
    {
      key: "title",
      header: "Title",
      filterable: false,
      cell: (page) => (
        <span className="font-medium text-foreground">{page.title}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      filterable: false,
      cell: (page) => (
        <button
          onClick={() => {
            window.open(
              `${process.env.NEXT_PUBLIC_SITE_URL}/${page.slug}`,
              "_blank",
            );
          }}
          className="text-xs font-mono text-primary hover:underline cursor-pointer"
        >
          /{page.slug}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      filterable: true,
      filterValue: (page) => page.status,
      cell: (page) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            page.status === "PUBLISHED"
              ? "bg-success/20 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              page.status === "PUBLISHED" ? "bg-success" : "bg-muted-foreground"
            }`}
          />
          {page.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      filterable: false,
      cell: (page) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate((page as any).createdAt)}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Last Modified",
      filterable: false,
      cell: (page) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate((page as any).updatedAt || page.modified)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      filterable: false,
      className: "text-right",
      cell: (page) =>
        deleteConfirm === page.id ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Delete?</span>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-2 text-xs"
              onClick={() => deletePage(page.id)}
              disabled={loading}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setDeleteConfirm(null)}
              disabled={loading}
            >
              No
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(page.id)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              title="Edit page"
            >
              <Pencil size={15} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTogglePublish(page)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              title={page.status === "PUBLISHED" ? "Unpublish" : "PUBLISHED"}
            >
              {page.status === "PUBLISHED" ? (
                <EyeOff size={15} />
              ) : (
                <Eye size={15} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(page.id)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Delete page"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        ),
    },
  ];

  if (editingPage) {
    return (
      <PageEditor
        page={editingPage}
        pages={pages}
        homepagePageId={homepagePageId}
        onChange={setEditingPage}
        onSave={savePage}
        onCancel={() => {
          setEditingPage(null);
          setIsNewPage(false);
        }}
      />
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground mb-1">
            Pages
          </h1>
          <p className="text-sm font-mono text-muted-foreground">
            {pages.length} page{pages.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/20 text-destructive text-sm rounded">
          {error}
        </div>
      )}
      {selectedPages.length > 0 && (
        <Button
          variant="destructive"
          size="sm"
          onClick={deleteSelected}
          disabled={bulkDeleteLoading}
        >
          Delete All ({selectedPages.length})
        </Button>
      )}

      <DataTable
        data={pages}
        columns={columns}
        searchPlaceholder="Search pages..."
        enableRowSelection={true}
        searchKeys={["title", "slug"]}
        pageSize={10}
        emptyMessage="No pages found. Create your first page to get started."
        onSelectedRowsChange={setSelectedPages}
        selectedRows={selectedPages}
        toolbarActions={
          <div className="flex items-center gap-2">
            {/* Import — Upload icon makes sense: bringing data IN */}
            <Button
              onClick={handleImport}
              disabled={loading}
              size="sm"
              variant="secondary"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Upload size={15} />
              Import
            </Button>

            {/* Export — Download icon makes sense: taking data OUT */}
            <Button
              onClick={handleExport}
              disabled={loading}
              size="sm"
              variant="secondary"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Download size={15} />
              Export
            </Button>

            <Button
              onClick={handleNewPage}
              disabled={loading}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus size={15} />
              New Page
            </Button>
          </div>
        }
      />
    </div>
  );
}
