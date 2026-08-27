"use client";

import { useState } from "react";
import { getBaseUrl } from "@/src/lib/config";

export default function ShareModal({
  fileIds,
  onClose,
  onSuccess,
}: {
  fileIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [passwordMode, setPasswordMode] = useState<"auto" | "custom">("auto");
  const [customPassword, setCustomPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const fileCount = fileIds?.length ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fileIds || fileIds.length === 0) {
      return setError("No files selected to share.");
    }

    if (passwordMode === "custom" && customPassword.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch(`${getBaseUrl()}/api/files/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds,
          email,
          message,
          password: passwordMode === "custom" ? customPassword : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to share");

      setSent(true);
      // onSuccess();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
          <p className="mb-4 font-medium text-slate-900">
            {fileCount > 1
              ? `${fileCount} files shared with ${email}`
              : `File shared with ${email}`}
          </p>
          <button
            onClick={() => {
              if (onSuccess) {
                onSuccess();
              } else {
                onClose();
              }
            }}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          {fileCount > 1 ? `Share ${fileCount} Files` : "Share File"}
        </h2>
        {fileCount > 1 && (
          <p className="mb-4 text-xs text-slate-500">
            One link and password will unlock all {fileCount} files.
          </p>
        )}

        <input
          type="email"
          placeholder="Recipient email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400 ${
            fileCount > 1 ? "mb-3" : "mb-3 mt-3"
          }`}
        />

        <textarea
          placeholder="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
          rows={2}
        />

        <div className="mb-3">
          <label className="mb-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              checked={passwordMode === "auto"}
              onChange={() => setPasswordMode("auto")}
            />
            Auto-generate password
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              checked={passwordMode === "custom"}
              onChange={() => setPasswordMode("custom")}
            />
            Set custom password
          </label>
        </div>

        {passwordMode === "custom" && (
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2.5 pr-16 text-sm outline-none focus:border-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-2 text-xs text-slate-500"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        )}

        {error && <p className="mb-2 text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {sending ? "Sending..." : "Share"}
          </button>
        </div>
      </form>
    </div>
  );
}
