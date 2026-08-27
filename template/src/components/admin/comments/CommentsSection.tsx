"use client";

import { useState, useEffect, useCallback } from "react";
import { getBaseUrl } from "@/src/lib/config";
import CommentRow from "./CommentRow";
import CommentReplyModal from "./commentReplyModal";

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorUrl?: string | null;
  status: "PENDING" | "APPROVED" | "SPAM" | "TRASH";
  parentId?: string | null;
  postId: string;
  createdAt: string;
  updatedAt: string;
  post?: { id: string; title: string; slug: string } | null;
  user?: { id: number; email: string } | null;
}

interface CommentCounts {
  all: number;
  pending: number;
  approved: number;
  spam: number;
  trash: number;
}

interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  data: {
    comments: Comment[];
    totalPages: number;
  };
}

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "spam", label: "Spam" },
  { key: "trash", label: "Trash" },
];

export default function CommentsSection() {
  const [tab, setTab] = useState<string>("all");
  const [comments, setComments] = useState<Comment[]>([]);
  const [counts, setCounts] = useState<Partial<CommentCounts>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [bulkAction, setBulkAction] = useState<string>("");

  const fetchCounts = useCallback(async () => {
    const res = await fetch(`${getBaseUrl()}/api/comments/counts`);
    const data: CommentCounts = await res.json();
    setCounts(data.data);
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status: tab,
      page: String(page),
      perPage: "20",
      ...(search && { search }),
    });
    const res = await fetch(`${getBaseUrl()}/api/comments?${params}`);
    const data: CommentsResponse = await res.json();
    setComments(data.data.comments ?? []);
    setTotalPages(data.data.totalPages ?? 1);
    setSelected([]);
    setLoading(false);
  }, [tab, page, search]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ── Actions ──────────────────────────────────────────────

  async function handleStatusChange(id: string, status: string): Promise<void> {
    await fetch(`${getBaseUrl()}/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchComments();
    fetchCounts();
  }

  async function handleDelete(id: string): Promise<void> {
    if (!confirm("Permanently delete this comment?")) return;
    await fetch(`${getBaseUrl()}/api/comments/${id}`, { method: "DELETE" });
    fetchComments();
    fetchCounts();
  }

  async function handleBulkAction(): Promise<void> {
    if (!bulkAction || !selected.length) return;
    if (
      bulkAction === "delete" &&
      !confirm(`Delete ${selected.length} comments?`)
    )
      return;

    await fetch(`${getBaseUrl()}/api/comments/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, action: bulkAction }),
    });

    setBulkAction("");
    setSelected([]);
    fetchComments();
    fetchCounts();
  }

  function toggleSelect(id: string): void {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll(): void {
    if (selected.length === comments.length) setSelected([]);
    else setSelected(comments.map((c) => c.id));
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="p-8  mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Comments</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search comments..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setPage(1);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {counts[t.key as keyof CommentCounts] !== undefined && (
              <span
                className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${
                  t.key === "pending" && (counts.pending ?? 0) > 0
                    ? "bg-red-100 text-red-600 font-semibold"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[t.key as keyof CommentCounts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm"
        >
          <option value="">Bulk Actions</option>
          <option value="approved">Approve</option>
          <option value="pending">Mark as Pending</option>
          <option value="spam">Mark as Spam</option>
          <option value="trash">Move to Trash</option>
          <option value="delete">Delete Permanently</option>
        </select>
        <button
          onClick={handleBulkAction}
          disabled={!selected.length || !bulkAction}
          className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800 disabled:opacity-40"
        >
          Apply ({selected.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    selected.length === comments.length && comments.length > 0
                  }
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Author
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Comment
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                In response to
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : comments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  No comments found.
                </td>
              </tr>
            ) : (
              comments.map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  selected={selected.includes(comment.id)}
                  onSelect={() => toggleSelect(comment.id)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onReply={() => setReplyTarget(comment)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <CommentReplyModal
          comment={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSuccess={() => {
            setReplyTarget(null);
            fetchComments();
            fetchCounts();
          }}
        />
      )}
    </div>
  );
}
