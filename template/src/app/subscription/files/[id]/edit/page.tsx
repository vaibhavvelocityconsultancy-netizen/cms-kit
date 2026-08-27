"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "@/src/lib/apimutation";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/src/hooks/use-toast";
// import { apiMutations } from "@/src/lib/apiMutations";

type FileCategoryOption = {
  id: string;
  name: string;
};

export default function EditFilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [isShareable, setIsShareable] = useState(true);
  const [tags, setTags] = useState(""); // ← plain string
  const [file, setFile] = useState(null);
  const [currentFile, setCurrentFile] = useState<any>(null);
  const [categories, setCategories] = useState<FileCategoryOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const queryClient = useQueryClient(); // ← instance, inside the component

  useEffect(() => {
    async function load() {
      try {
        const [fileRes, catRes] = await Promise.all([
          fetchers.fileById(params.id),
          fetchers.fileCategoriesPublic(),
        ]);

        const file = fileRes.data;
        setCurrentFile(file);
        setTitle(file.title ?? "");
        setCategoryId(file.categoryId ?? "");
        setShortDesc(file.shortDesc ?? "");
        setDescription(file.description ?? "");
        setIsShareable(file.isShareable ?? true);
        setTags(file.tags ?? ""); // ← plain string, prefills directly
        setCategories(catRes.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("categoryId", categoryId || "");
      formData.append("shortDesc", shortDesc.trim());
      formData.append("description", description.trim());
      formData.append("tags", tags.trim());
      formData.append("isShareable", String(isShareable));

      if (file) {
        formData.append("file", file);
      }

      await apiMutations.updateFile(params.id, formData);

      queryClient.invalidateQueries({
        queryKey: ["shared-files"],
      });

      router.push("/subscription/file-sharing");

      toast({
        title: "Success",
        description: "File updated successfully",
      });
    } catch (err) {
      console.error("Edit file load error:", err); // ← add this
      setError(err instanceof Error ? err.message : "Failed to update file");
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 p-6">
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Edit File</h1>
          <p className="text-sm text-slate-500">
            Update the details for this file.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl p-6">
          <div className="mb-4 rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-700">Current File</p>

            {currentFile && (
              <>
                <a
                  href={currentFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline"
                >
                  {currentFile.originalName}
                </a>

                <p className="mt-1 text-xs text-slate-500">
                  {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Replace File
            </label>

            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <p className="text-xs text-slate-500">
              Leave empty to keep the existing file.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tags{" "}
              <span className="text-slate-400">
                (optional, comma-separated)
              </span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. invoice, 2026, urgent"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Short description{" "}
              <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              maxLength={140}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Long description{" "}
              <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Shareable</p>
              <p className="text-xs text-slate-500">
                Allow this file to be shared via a link.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isShareable}
              onClick={() => setIsShareable((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isShareable ? "bg-slate-900" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isShareable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/subscription/file-sharing")}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
