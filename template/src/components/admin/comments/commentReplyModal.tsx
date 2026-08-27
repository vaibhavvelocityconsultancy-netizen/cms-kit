"use client";

import { useState } from "react";
import { api } from "@/src/lib/axios";

type CommentStatus = "PENDING" | "APPROVED" | "SPAM" | "TRASH";

interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorEmail: string;
  authorUrl?: string | null;
  status: CommentStatus;
  parentId?: number | null;
  postId: number;
  createdAt: string;
  post?: { id: number; title: string; slug: string } | null;
}

interface CommentReplyModalProps {
  comment: Comment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CommentReplyModal({
  comment,
  onClose,
  onSuccess,
}: CommentReplyModalProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!content.trim()) return;

    try {
      setLoading(true);
      setError("");

      await api.post(`/api/comments/${comment.id}/reply`, {
        content,
      });

      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to post reply");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Reply to Comment
        </h2>

        {/* Original comment preview */}
        <div className="bg-gray-50 border rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1 font-medium">
            {comment.authorName} wrote:
          </p>

          <p className="text-sm text-gray-700">{comment.content}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your reply..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
