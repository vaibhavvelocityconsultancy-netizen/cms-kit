"use client";
import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/src/lib/config";
import { Download, Eye } from "lucide-react";
import { Badge } from "@/src/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/ui/tabs";
import { appUrl } from "@/src/lib/base-path";

interface ShareRecord {
  shareId: string;
  sharedWith: string;
  createdAt: string;
  viewedAt: string | null;
  zipDownloadedAt: string | null;
  fileCount: number;
  fileTitles: string[];
}

interface UploadedFile {
  id: string;
  title: string;
  originalName: string;
  category: {
    name: string;
  } | null;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

interface UserDetails {
  user: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
  };
  plan: {
    title: string;
    status: string;
    billingCycle: string;
    startsAt: string | null;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
  } | null;
  shares: ShareRecord[];
  uploadedFiles: UploadedFile[];
}

function statusVariant(status: string) {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "TRIAL":
      return "secondary";
    case "EXPIRED":
    case "CANCELED":
      return "destructive";
    default:
      return "outline";
  }
}

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function getDownloadUrl(url: string): string {
  return appUrl(url);
}

export default function UserDetailsModal({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery<UserDetails>({
    queryKey: ["admin-user-details", userId],
    queryFn: async () => {
      const res = await fetch(
        `${getBaseUrl()}/api/subscription-user/${userId}/`,
      );
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        {isLoading || !data ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {data.user.name || "—"}
                </h2>
                <p className="text-sm text-slate-500">{data.user.email}</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                Close
              </button>
            </div>

            {/* ── Plan Details ── */}
            <section className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-slate-700">
                Plan Details
              </h3>
              {data.plan ? (
                <div className="rounded-lg border border-slate-200 p-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Plan</p>
                    <p className="font-medium">{data.plan.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <Badge variant={statusVariant(data.plan.status) as any}>
                      {data.plan.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Billing Cycle</p>
                    <p className="font-medium">{data.plan.billingCycle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">
                      Current Period Ends
                    </p>
                    <p className="font-medium">
                      {data.plan.currentPeriodEnd
                        ? new Date(
                            data.plan.currentPeriodEnd,
                          ).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  {data.plan.trialEndsAt && (
                    <div>
                      <p className="text-xs text-slate-400">Trial Ends</p>
                      <p className="font-medium">
                        {new Date(data.plan.trialEndsAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No active plan.</p>
              )}
            </section>

            {/* ── Tabs ── */}
            <Tabs defaultValue="shared" className="w-full">
              <TabsList className="w-full justify-start border-b border-slate-200 rounded-none bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="shared"
                  className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none text-slate-500 hover:text-slate-700 rounded-none bg-transparent data-[state=active]:bg-transparent"
                >
                  Files Shared ({data.shares.length})
                </TabsTrigger>
                <TabsTrigger
                  value="uploaded"
                  className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none text-slate-500 hover:text-slate-700 rounded-none bg-transparent data-[state=active]:bg-transparent"
                >
                  Files Uploaded ({data.uploadedFiles?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* ── Files Shared Tab ── */}
              <TabsContent value="shared" className="mt-4">
                <section>
                  <h3 className="mb-2 text-sm font-medium text-slate-700">
                    Files Shared ({data.shares.length})
                  </h3>
                  {data.shares.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No files shared yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.shares.map((share) => (
                        <div
                          key={share.shareId}
                          className="rounded-lg border border-slate-200 p-3 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {share.fileCount > 1
                                ? `${share.fileTitles[0]} +${share.fileCount - 1} more`
                                : share.fileTitles[0]}
                            </p>
                            <span className="text-xs text-slate-400">
                              {new Date(share.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              Shared with:
                            </span>
                            <span className="text-sm font-medium text-slate-800">
                              {share.sharedWith}
                            </span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Badge
                              variant={share.viewedAt ? "default" : "outline"}
                            >
                              {share.viewedAt ? "Viewed" : "Not viewed"}
                            </Badge>
                            {share.fileCount > 1 && (
                              <Badge
                                variant={
                                  share.zipDownloadedAt ? "default" : "outline"
                                }
                              >
                                {share.zipDownloadedAt
                                  ? "Zip downloaded"
                                  : "Zip not downloaded"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </TabsContent>

              {/* ── Files Uploaded Tab ── */}
              <TabsContent value="uploaded" className="mt-4">
                <section>
                  <h3 className="mb-2 text-sm font-medium text-slate-700">
                    Files Uploaded ({data.uploadedFiles?.length || 0})
                  </h3>
                  {!data.uploadedFiles || data.uploadedFiles.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No files uploaded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="rounded-lg border border-slate-200 p-3 text-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">
                                {file.title}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {file.originalName}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {file.category && (
                                <Badge variant="secondary">
                                  {file.category.name}
                                </Badge>
                              )}
                              <a
                                href={appUrl(file.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`View ${file.title}`}
                                title="View file"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                              <a
                                href={appUrl(file.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={file.originalName}
                                aria-label={`Download ${file.title}`}
                                title="Download file"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-slate-400">
                              {file.mimeType}
                            </span>
                            <span className="text-xs text-slate-300">|</span>
                            <span className="text-xs text-slate-600">
                              {formatFileSize(file.size)}
                            </span>
                            <span className="text-xs text-slate-300">|</span>
                            <span className="text-xs text-slate-400">
                              Uploaded:{" "}
                              {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
