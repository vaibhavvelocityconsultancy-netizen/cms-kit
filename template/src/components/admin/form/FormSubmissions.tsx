"use client";

import { useEffect, useState } from "react";
import { Trash2, Download } from "lucide-react";
import { Button } from "@/src/ui/button";
import { getApiBaseUrl } from "@/src/lib/axios";

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

interface Submission {
  id: number;
  data: Record<string, any>;
  ipAddress: string | null;
  createdAt: string;
}

export function FormSubmissions({ formId }: { formId: number }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const numericFormId = Number(formId);
  const hasValidFormId = Number.isInteger(numericFormId) && numericFormId > 0;

  const fetchSubmissions = async () => {
    if (!hasValidFormId) return;

    try {
      setLoading(true);
      const res = await fetch(
        apiPath(`/api/form/${numericFormId}/submissions?page=${page}&perPage=20`),
      );
      const data = await res.json();
      setSubmissions(data.data?.submissions ?? []);
      setTotalPages(data.data?.totalPages ?? 1);
      setTotal(data.data?.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [formId, page]);

  async function handleDelete(id: number) {
    if (!hasValidFormId) return;

    await fetch(apiPath(`/api/form/${numericFormId}/submissions`), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchSubmissions();
  }

  // Mark all as read when submissions tab opens
  useEffect(() => {
    if (!hasValidFormId) return;

    fetch(apiPath(`/api/form/${numericFormId}/submissions/mark-read`), {
      method: "PATCH",
    });
  }, [hasValidFormId, numericFormId]);
  function exportCsv() {
    if (!submissions.length) return;

    const keys = Object.keys(submissions[0].data);
    const header = ["Date", "IP", ...keys].join(",");
    const rows = submissions.map((s) => {
      const values = [
        new Date(s.createdAt).toLocaleString(),
        s.ipAddress || "",
        ...keys.map(
          (k) => `"${(s.data[k] ?? "").toString().replace(/"/g, '""')}"`,
        ),
      ];
      return values.join(",");
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-${numericFormId}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Submissions</h2>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        {submissions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="flex items-center gap-2"
          >
            <Download size={14} />
            Export CSV
          </Button>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No submissions yet.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="border border-border rounded-lg bg-card overflow-hidden"
              >
                {/* Submission header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                  <span className="text-sm font-medium text-foreground">
                    {formatDate(sub.createdAt)}
                  </span>
                  <div className="flex items-center gap-3">
                    {sub.ipAddress && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {sub.ipAddress}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete submission"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Submission data */}
                <div className="p-4">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {Object.entries(sub.data).map(([key, value]) => (
                        <tr key={key}>
                          <td className="py-2 pr-4 font-medium text-muted-foreground w-40 align-top">
                            {key}
                          </td>
                          <td className="py-2 text-foreground break-words">
                            {String(value ?? "")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
