"use client";

import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/src/lib/config";

export default function SharesDrawer({
  fileId,
  onClose,
}: {
  fileId: string;
  onClose: () => void;
}) {
  const { data: shares, isLoading } = useQuery({
    queryKey: ["file-shares", fileId],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/files/${fileId}/shares`);
      const json = await res.json();
      return json.data;
    },
  });

  function statusFor(share: any) {
    if (share.downloadedAt)
      return { label: "Downloaded", color: "text-green-600" };
    if (share.viewedAt) return { label: "Viewed", color: "text-blue-600" };
    return { label: "Sent", color: "text-gray-400" };
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-sm overflow-y-auto bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Share History
          </h2>
          <button onClick={onClose} className="text-slate-500">
            ✕
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : shares?.length === 0 ? (
          <p className="text-sm text-slate-500">Not shared yet.</p>
        ) : (
          <div className="space-y-3">
            {shares?.map((s: any) => {
              const status = statusFor(s);
              return (
                <div
                  key={s.shareId}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {s.sharedWith}
                  </p>
                  <p className={`text-xs ${status.color}`}>{status.label}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
