"use client";

type CommentStatus = "PENDING" | "APPROVED" | "SPAM" | "TRASH";

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorUrl?: string | null;
  status: CommentStatus;
  parentId?: string | null;
  postId: string;
  createdAt: string;
  post?: { id: string; title: string; slug: string } | null;
}

interface CommentRowProps {
  comment: Comment;
  selected: boolean;
  onSelect: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onReply: () => void;
}

const STATUS_STYLES: Record<CommentStatus, string> = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING:  "bg-yellow-100 text-yellow-700",
  SPAM:     "bg-red-100 text-red-700",
  TRASH:    "bg-gray-100 text-gray-600",
};

export default function CommentRow({
  comment,
  selected,
  onSelect,
  onStatusChange,
  onDelete,
  onReply,
}: CommentRowProps) {
  const isTrash = comment.status === "TRASH";

  return (
    <tr className={`group transition-colors ${
      comment.status === "PENDING"
        ? "bg-yellow-50 hover:bg-yellow-100"
        : "hover:bg-gray-50"
    }`}>
      {/* Checkbox */}
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="rounded"
        />
      </td>

      {/* Author */}
      <td className="px-4 py-4 align-top">
        <div className="font-medium text-gray-800">{comment.authorName}</div>
        <div className="text-gray-500 text-xs mt-0.5">{comment.authorEmail}</div>
        {comment.authorUrl && (
          <a
            href={comment.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 text-xs hover:underline"
          >
            {comment.authorUrl}
          </a>
        )}
      </td>

      {/* Comment + inline actions */}
      <td className="px-4 py-4 align-top max-w-md">
        {comment.parentId && (
          <p className="text-xs text-gray-400 mb-1 italic">↩ Reply</p>
        )}
        <p className="text-gray-700 leading-relaxed line-clamp-3">
          {comment.content}
        </p>

        {/* Actions — visible on row hover */}
        <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {comment.status !== "APPROVED" && !isTrash && (
            <button
              onClick={() => onStatusChange(comment.id, "approved")}
              className="text-green-600 hover:underline text-xs font-medium"
            >
              Approve
            </button>
          )}
          {comment.status === "APPROVED" && (
            <button
              onClick={() => onStatusChange(comment.id, "pending")}
              className="text-yellow-600 hover:underline text-xs font-medium"
            >
              Unapprove
            </button>
          )}
          {!isTrash && (
            <button
              onClick={onReply}
              className="text-blue-600 hover:underline text-xs font-medium"
            >
              Reply
            </button>
          )}
          {comment.status !== "SPAM" && !isTrash && (
            <button
              onClick={() => onStatusChange(comment.id, "spam")}
              className="text-orange-500 hover:underline text-xs font-medium"
            >
              Spam
            </button>
          )}
          {!isTrash ? (
            <button
              onClick={() => onStatusChange(comment.id, "trash")}
              className="text-red-500 hover:underline text-xs font-medium"
            >
              Trash
            </button>
          ) : (
            <>
              <button
                onClick={() => onStatusChange(comment.id, "approved")}
                className="text-green-600 hover:underline text-xs font-medium"
              >
                Restore
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="text-red-600 hover:underline text-xs font-medium"
              >
                Delete Permanently
              </button>
            </>
          )}
        </div>
      </td>

      {/* Post title */}
      <td className="px-4 py-4 align-top text-sm">
        {comment.post ? (
          <a
            href={`/posts/${comment.post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {comment.post.title}
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      {/* Status badge */}
      <td className="px-4 py-4 align-top">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[comment.status]}`}>
          {comment.status.charAt(0) + comment.status.slice(1).toLowerCase()}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-4 align-top text-xs text-gray-500 whitespace-nowrap">
        {new Date(comment.createdAt).toLocaleDateString("en-US", {
          year: "numeric", month: "short", day: "numeric",
        })}
        <br />
        {new Date(comment.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit", minute: "2-digit",
        })}
      </td>
    </tr>
  );
}