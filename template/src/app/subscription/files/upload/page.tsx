"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Link,
  FileText,
  Tag,
  Info,
  AlignLeft,
  Loader2,
} from "lucide-react";
import { toast } from "@/src/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/src/lib/config";

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
  const [dragActive, setDragActive] = useState(false);
  const [tags, setTags] = useState("");

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
          setCategoryId(items[0].id); // ✅ use id, not name
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);
  const [categoryId, setCategoryId] = useState(""); // rename from `category`

  const queryClient = useQueryClient();
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return setError("Please select a file");

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("categoryId", categoryId); // ✅ renamed from "category"
      formData.append("tags", tags);
      formData.append("shortDesc", shortDescription);
      formData.append("description", longDescription);
      formData.append("isShareable", String(isShareable));

      const res = await fetch(`${getBaseUrl()}/api/files`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed");

      router.push("/subscription/file-sharing");
      queryClient.invalidateQueries({ queryKey: ["shared-files"] }); // ✅ add this
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 p-6">
      <button
        onClick={() => router.push("/subscription/file-sharing")}
        className="group inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to files
      </button>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Upload File
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Add a file to your workspace and organize it with a category.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <span>{error}</span>
            </div>
          )}

          {/* File Upload Area */}
          <div
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
              dragActive
                ? "border-slate-400 bg-slate-50/50 scale-[1.01]"
                : file
                  ? "border-green-400 bg-green-50/30"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="p-8 text-center">
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-green-100 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Click to
                      change
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Drop your file here, or{" "}
                    <span className="text-slate-900 underline underline-offset-2">
                      browse
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports any file type up to 50MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-400" />
                  Title
                </span>
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter a descriptive title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
              />
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  Category
                </span>
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories || categories.length === 0}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingCategories ? (
                  <option value="">Loading categories...</option>
                ) : categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {" "}
                      {/* ✅ id, not name */}
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  Tags
                </span>
                <span className="text-slate-400 text-xs font-normal ml-1">
                  (optional, comma-separated)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. invoice, 2026, urgent"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
              />
            </div>

            {/* Short Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-slate-400" />
                  Short Description
                </span>
                <span className="text-slate-400 text-xs font-normal ml-1">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                placeholder="One-line summary shown on the file card"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={140}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
              />
              <div className="flex justify-end mt-1.5">
                <span
                  className={`text-xs ${shortDescription.length > 120 ? "text-orange-500" : "text-slate-400"}`}
                >
                  {shortDescription.length}/140
                </span>
              </div>
            </div>

            {/* Long Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Long Description
                </span>
                <span className="text-slate-400 text-xs font-normal ml-1">
                  (optional)
                </span>
              </label>
              <textarea
                placeholder="Full details about this file"
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 resize-none"
              />
            </div>
          </div>

          {/* Shareable Toggle */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Link className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Shareable</p>
                <p className="text-xs text-slate-500">
                  Allow this file to be shared via a link with others
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isShareable}
              onClick={() => setIsShareable((prev) => !prev)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
                isShareable
                  ? "bg-slate-900 shadow-lg shadow-slate-900/20"
                  : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isShareable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/files")}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload File
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
