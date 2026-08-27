"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getBaseUrl } from "@/src/lib/config";
import { useRouter } from "next/navigation";

type FileCategoryOption = {
  id: string;
  name: string;
};

export default function UploadFilePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [isShareable, setIsShareable] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<FileCategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${getBaseUrl()}/api/public/file-category`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.message || "Failed to load categories");

        const items = Array.isArray(json?.data) ? json.data : [];
        setCategories(items);
        if (items.length > 0) {
          setCategory(items[0].name);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return setError("Please select a file");

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("category", category);
      formData.append("shortDescription", shortDescription);
      formData.append("longDescription", longDescription);
      formData.append("isShareable", String(isShareable));

      const res = await fetch(`${getBaseUrl()}/api/files`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed");

      router.push("/files");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Upload File</h1>
        <p className="text-sm text-slate-500">
          Add a file to your workspace and organize it with a category.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loadingCategories || categories.length === 0}
            className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingCategories ? (
              <option value="">Loading categories...</option>
            ) : categories.length === 0 ? (
              <option value="">No categories available</option>
            ) : (
              categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Short description */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Short description <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="One-line summary, shown on the file card"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={140}
            className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
          />
          <p className="mt-1 text-xs text-slate-400">
            {shortDescription.length}/140
          </p>
        </div>

        {/* Long description */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Long description <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            placeholder="Full details about this file"
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
          />
        </div>

        {/* Is shareable — toggle switch */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Shareable</p>
            <p className="text-xs text-slate-500">
              Allow this file to be shared via a link with others.
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

        {/* File */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            File
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
            className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/files")}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
