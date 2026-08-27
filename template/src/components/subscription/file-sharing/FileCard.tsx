"use client";

import { useState } from "react";
import Link from "next/link"; // ← ADD THIS
import ShareModal from "./ShareModal";
import SharesDrawer from "./SharesDrawer";
import { Eye, Pencil, Trash } from "lucide-react";
import { appUrl } from "@/src/lib/base-path";

type FileCardProps = {
  file: any;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onDelete?: () => void; // ← ADD THIS
};

export default function FileCard({
  file,
  selectable = false,
  selected = false,
  onToggleSelect,
  onDelete, // ← ADD THIS
}: FileCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [sharesOpen, setSharesOpen] = useState(false);

  function handleCardClick() {
    if (selectable && file.isShareable) onToggleSelect?.();
  }

  return (
    <div
      onClick={handleCardClick}
      className={`relative rounded-xl border bg-white p-4 shadow-sm transition-colors ${
        selectable && file.isShareable ? "cursor-pointer" : ""
      } ${
        selected ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"
      } ${selectable && !file.isShareable ? "opacity-60" : ""}`}
    >
      {selectable && (
        <div className="absolute right-3 top-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            disabled={!file.isShareable}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect?.();
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </div>
      )}

      <div className="mb-3 flex items-center justify-between pr-6">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
          {file.category?.name ?? "Uncategorized"}
        </span>
        <span className="text-xs text-slate-400">
          {(file.size / 1024).toFixed(0)} KB
        </span>
      </div>

      <h3 className="truncate font-medium text-slate-900">{file.title}</h3>

      {file.shortDesc ? (
        <p className="mt-1 truncate text-sm text-slate-600">{file.shortDesc}</p>
      ) : null}

      {file.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
          {file.description}
        </p>
      ) : null}

      {/* {file.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {file.tags?.map((tag: any) => (
            <span
              key={tag.id}
              className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )} */}

      {!file.isShareable && (
        <p className="mt-2 text-[11px] font-medium text-amber-600">
          Not shareable
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSharesOpen(true);
          }}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          View shares
        </button>

        <div className="flex items-center gap-2">
          <Link
            href={`/subscription/files/${file.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="mr-1 inline h-3 w-3" />
          </Link>

          <a
            href={appUrl(file.url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Eye className="mr-1 inline h-3 w-3" />
          </a>
          <button
            onClick={onDelete}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            <Trash className="mr-1 inline h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (file.isShareable) setShareOpen(true);
            }}
            disabled={!file.isShareable}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Share
          </button>
        </div>
      </div>

      {shareOpen && (
        <ShareModal fileIds={[file.id]} onClose={() => setShareOpen(false)} />
      )}
      {sharesOpen && (
        <SharesDrawer fileId={file.id} onClose={() => setSharesOpen(false)} />
      )}
    </div>
  );
}
