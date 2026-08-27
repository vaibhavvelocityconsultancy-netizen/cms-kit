"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getBaseUrl } from "@/src/lib/config";

type SharedFileMeta = { title: string; category: string };
type UnlockedFile = {
  itemId: string;
  fileId: string;
  fileUrl: string;
  mimeType: string;
  fileName: string;
  title: string;
  size: number;
  downloadedAt: string | null;
};

export default function PasswordGate({ token }: { token: string }) {
  const [meta, setMeta] = useState<{
    fileCount: number;
    files: SharedFileMeta[];
  } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState<{
    sharedWith: string;
    message: string | null;
    files: UnlockedFile[];
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sheetCache, setSheetCache] = useState<Record<string, any[][]>>({});
  const [sheetLoadingId, setSheetLoadingId] = useState<string | null>(null);
  const [zipDownloading, setZipDownloading] = useState(false);

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/shared/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json) => setMeta(json.data))
      .catch(() => setNotFound(true));
  }, [token]);

  const isSpreadsheet = (mimeType: string) =>
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch(`${getBaseUrl()}/api/shared/${token}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const json = await res.json();
    if (!res.ok) return setError(json.message || "Wrong password");

    setUnlocked(json.data);
  }

  async function loadSheetPreview(file: UnlockedFile) {
    if (sheetCache[file.itemId]) return;
    setSheetLoadingId(file.itemId);
    try {
      const fileRes = await fetch(file.fileUrl);
      const arrayBuffer = await fileRes.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
      }) as any[][];
      setSheetCache((prev) => ({ ...prev, [file.itemId]: rows }));
    } catch {
      setSheetCache((prev) => ({ ...prev, [file.itemId]: [] }));
    } finally {
      setSheetLoadingId(null);
    }
  }

  function togglePreview(file: UnlockedFile) {
    const next = expandedId === file.itemId ? null : file.itemId;
    setExpandedId(next);
    if (next && isSpreadsheet(file.mimeType)) {
      loadSheetPreview(file);
    }
  }

  function handleDownload(fileId: string) {
    window.location.href = `${getBaseUrl()}/api/shared/${token}/download/${fileId}`;
  }

  async function handleDownloadAll() {
    setZipDownloading(true);
    try {
      window.location.href = `${getBaseUrl()}/api/shared/${token}/download-zip`;
    } finally {
      setZipDownloading(false);
    }
  }

  if (notFound) {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center">
        <p className="text-gray-500">This link is invalid or has expired.</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (unlocked) {
    return (
      <div className="max-w-3xl mx-auto mt-10 border rounded-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {unlocked.files.length > 1
                ? `${unlocked.files.length} files shared with you`
                : unlocked.files[0]?.title}
            </h1>
            {unlocked.message && (
              <p className="text-sm text-gray-500 mt-1">{unlocked.message}</p>
            )}
          </div>

          {unlocked.files.length > 1 && (
            <button
              onClick={handleDownloadAll}
              disabled={zipDownloading}
              className="px-4 py-2 bg-gray-900 text-white rounded text-sm whitespace-nowrap disabled:opacity-50"
            >
              {zipDownloading ? "Preparing..." : "Download All (.zip)"}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {unlocked.files.map((file) => {
            const isImage = file.mimeType.startsWith("image/");
            const isPdf = file.mimeType === "application/pdf";
            const isVideo = file.mimeType.startsWith("video/");
            const isAudio = file.mimeType.startsWith("audio/");
            const isSheet = isSpreadsheet(file.mimeType);
            const isExpanded = expandedId === file.itemId;
            const sheetRows = sheetCache[file.itemId];

            return (
              <div
                key={file.itemId}
                className="border rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <button
                    onClick={() => togglePreview(file)}
                    className="text-left flex-1"
                  >
                    <p className="font-medium text-sm">{file.title}</p>
                    <p className="text-xs text-gray-500">
                      {file.fileName} · {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </button>
                  <button
                    onClick={() => handleDownload(file.fileId)}
                    className="ml-3 px-3 py-1.5 bg-gray-900 text-white rounded text-sm whitespace-nowrap"
                  >
                    Download
                  </button>
                </div>

                {isExpanded && (
                  <div className="bg-white">
                    {isImage && (
                      <img
                        src={file.fileUrl}
                        alt={file.title}
                        className="w-full h-auto"
                      />
                    )}
                    {isPdf && (
                      <iframe
                        src={file.fileUrl}
                        className="w-full h-[500px]"
                        title={file.title}
                      />
                    )}
                    {isVideo && (
                      <video src={file.fileUrl} controls className="w-full" />
                    )}
                    {isAudio && (
                      <audio
                        src={file.fileUrl}
                        controls
                        className="w-full p-4"
                      />
                    )}

                    {isSheet && (
                      <div className="overflow-auto max-h-[400px] p-2">
                        {sheetLoadingId === file.itemId ? (
                          <p className="text-center text-gray-500 py-8">
                            Loading spreadsheet...
                          </p>
                        ) : sheetRows && sheetRows.length > 0 ? (
                          <table className="w-full text-sm border-collapse">
                            <tbody>
                              {sheetRows.map((row, i) => (
                                <tr
                                  key={i}
                                  className={
                                    i === 0 ? "bg-gray-100 font-medium" : ""
                                  }
                                >
                                  {row.map((cell, j) => (
                                    <td
                                      key={j}
                                      className="border px-2 py-1 whitespace-nowrap"
                                    >
                                      {cell?.toString() ?? ""}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-center text-gray-500 py-8">
                            Preview not available.
                          </p>
                        )}
                      </div>
                    )}

                    {!isImage && !isPdf && !isVideo && !isAudio && !isSheet && (
                      <div className="p-8 text-center text-gray-500">
                        <p>Preview not available for this file type.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleUnlock}
      className="max-w-sm mx-auto mt-20 border rounded-lg p-6"
    >
      <h2 className="font-semibold mb-1">
        {meta.fileCount > 1
          ? `${meta.fileCount} files shared with you`
          : meta.files[0]?.title}
      </h2>
      {meta.fileCount > 1 && (
        <ul className="text-sm text-gray-500 mb-3 list-disc pl-4">
          {meta.files.map((f, i) => (
            <li key={i}>{f.title}</li>
          ))}
        </ul>
      )}
      <p className="text-sm text-gray-500 mb-4">
        {meta.fileCount > 1 ? "These files are" : "This file is"} password
        protected
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        className="border rounded w-full p-2"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      <button
        type="submit"
        className="bg-gray-900 text-white w-full mt-3 py-2 rounded"
      >
        Unlock
      </button>
    </form>
  );
}
