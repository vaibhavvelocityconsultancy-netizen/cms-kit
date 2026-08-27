"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/src/ui/button";
import { DataTable, Column } from "@/src/ui/data-table";
import { toast } from "@/src/hooks/use-toast";
import { FormEditor } from "./FormEditor";
import { getApiBaseUrl } from "@/src/lib/axios";
// import { FormEditor } from "./FormEditor";

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

interface Form {
  id: number;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  _count: { submissions: number };
}

export function FormsSection() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingForm, setEditingForm] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [selectedForms, setSelectedForms] = useState<Form[]>([]);
  const selectedSlug = selectedForms.length === 1 ? selectedForms[0].slug : "";

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiPath("/api/form"));
      const data = await res.json();
      setForms(data.data ?? []);
    } catch {
      setError("Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    if (selectedForms.length !== 1) return;

    const slug = selectedForms[0].slug;
    const embedText = `[form slug="${slug}"]`;

    navigator.clipboard
      .writeText(embedText)
      .then(() => {
        toast({
          title: "Copied form slug",
          description: `Embed code for "${slug}" copied to clipboard.`,
          variant: "success",
        });
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Could not copy the form slug automatically.",
          variant: "destructive",
        });
      });
  }, [selectedForms]);

  async function handleEdit(id: number) {
    const res = await fetch(apiPath(`/api/form/${id}`));
    const data = await res.json();
    setEditingForm(data.data);
    setIsNew(false);
  }

  async function handleDelete(id: number) {
    await fetch(apiPath(`/api/form/${id}`), { method: "DELETE" });
    setForms((prev) => prev.filter((f) => f.id !== id));
    setDeleteConfirm(null);
  }

  function handleNew() {
    setEditingForm({
      title: "",
      slug: "",
      fields: [],
      submitButtonLabel: "Submit",
      submitButtonClass: "",
      confirmationType: "message",
      confirmationMessage: "Thank you for your submission.",
      redirectUrl: "",
      emails: [],
      status: "active",
      layout: "default",
      twoColumnHeading: "",
      twoColumnParagraph: "",
    });
    setIsNew(true);
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const columns: Column<Form>[] = [
    {
      key: "title",
      header: "Title",
      filterable: false,
      cell: (f) => (
        <span className="font-medium text-foreground">{f.title}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      filterable: false,
      cell: (f) => (
        <code className="font-mono text-xs text-muted-foreground">
          {f.slug}
        </code>
      ),
    },
    {
      key: "submissions",
      header: "Submissions",
      filterable: false,
      cell: (f) => (
        <span className="text-sm text-muted-foreground">
          {f._count.submissions}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      filterable: true,
      filterValue: (f) => f.status,
      cell: (f) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            f.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              f.status === "active" ? "bg-green-500" : "bg-muted-foreground"
            }`}
          />
          {f.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      filterable: false,
      cell: (f) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate(f.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      filterable: false,
      // className: "text-center",
      cell: (f) =>
        deleteConfirm === f.id ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Delete?</span>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-2 text-xs"
              onClick={() => handleDelete(f.id)}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setDeleteConfirm(null)}
            >
              No
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(f.id)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              title="Edit form"
            >
              <Pencil size={15} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingForm(f);
                // show submissions view
              }}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              title="View submissions"
            >
              <FileText size={15} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(f.id)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Delete form"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        ),
    },
  ];

  if (editingForm) {
    return (
      <FormEditor
        form={editingForm}
        isNew={isNew}
        onSave={async (saved) => {
          await fetchForms();
          setEditingForm(null);
        }}
        onCancel={() => setEditingForm(null)}
      />
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground mb-1">
            Forms
          </h1>
          <p className="text-sm font-mono text-muted-foreground">
            {forms.length} form{forms.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-muted/50 bg-muted/10 p-4 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">
          Embed a form in page content:
        </p>
        {selectedSlug ? (
          <>
            <div className="mb-2 text-sm text-foreground">
              Selected slug:{" "}
              <code className="rounded bg-slate-950/5 px-1 py-0.5 font-mono">
                {selectedSlug}
              </code>
            </div>
            <div className="space-y-1">
              <code className="block rounded bg-slate-950/5 px-2 py-1 font-mono">
                {`[form slug="${selectedSlug}"]`}
              </code>
              <code className="block rounded bg-slate-950/5 px-2 py-1 font-mono">
                {`<div data-form="${selectedSlug}"></div>`}
              </code>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              The selected slug is copied automatically when one form row is
              selected.
            </p>
          </>
        ) : selectedForms.length > 1 ? (
          <p className="text-sm text-muted-foreground">
            Select only one form row to show and copy a single slug.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a form row to see its slug here and copy the embed code
            automatically.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
          {error}
        </div>
      )}

      <DataTable
        data={forms}
        columns={columns}
        searchPlaceholder="Search forms..."
        searchKeys={["title", "slug"]}
        pageSize={10}
        emptyMessage="No forms yet. Create your first form."
        enableRowSelection
        selectedRows={selectedForms}
        onSelectedRowsChange={setSelectedForms}
        toolbarActions={
          <Button
            onClick={handleNew}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus size={15} />
            New Form
          </Button>
        }
      />
    </div>
  );
}
