// components/admin/RedirectManager.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/ui/table";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/ui/tabs";
import { Badge } from "@/src/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
import {
  AlertCircle,
  Download,
  Upload,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Check,
} from "lucide-react";
import { toast } from "@/src/ui/use-toast";
import { getApiBaseUrl } from "@/src/lib/axios";
// import { toast } from 'sonner';

interface Redirect {
  id: string;
  sourceUrl: string;
  destinationUrl: string;
  statusCode: number;
  isActive: boolean;
  description?: string;
  hitCount: number;
  lastUsedAt?: string;
  isAutoDetected: boolean;
}

interface NotFoundLog {
  id: string;
  path: string;
  referrer?: string;
  isResolved: boolean;
  occurredAt: string;
}

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

export function RedirectManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("redirects");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sourceUrl: "",
    destinationUrl: "",
    statusCode: "301",
    description: "",
  });
  const [filters, setFilters] = useState({
    search: "",
    isActive: "all",
    isAutoDetected: "all",
  });
  // Fetch 404 analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ["404-analytics"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/logs/404/analytics"));
      const data = await res.json();
      return data.data;
    },
  });
  // Fetch redirects
  const { data: redirectsData, isLoading } = useQuery({
    queryKey: ["redirects", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.isActive !== "all")
        params.append("isActive", filters.isActive);
      if (filters.isAutoDetected !== "all")
        params.append("isAutoDetected", filters.isAutoDetected);

      const res = await fetch(apiPath(`/api/redirects?${params}`));
      const data = await res.json();
      return data.data || [];
    },
  });

  // Fetch 404 logs
  const { data: logsData } = useQuery({
    queryKey: ["404-logs"],
    queryFn: async () => {
      const res = await fetch(apiPath(`/api/redirects/404s?isResolved=false`));
      const data = await res.json();
      return data.data || [];
    },
  });

  // Create/Update redirect
  const mutation = useMutation({
    mutationFn: async () => {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? apiPath(`/api/redirects/${editingId}`)
        : apiPath("/api/redirects");

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          statusCode: parseInt(formData.statusCode),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save redirect");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({ title: editingId ? "Redirect updated" : "Redirect created" });
      queryClient.invalidateQueries({ queryKey: ["redirects"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to save redirect" });
    },
  });

  // Delete redirect
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiPath(`/api/redirects/${id}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Redirect deleted" });
      queryClient.invalidateQueries({ queryKey: ["redirects"] });
    },
    onError: () => {
      toast({ title: "Failed to delete redirect" });
    },
  });

  // Export redirects
  const handleExport = async () => {
    try {
      const response = await fetch(apiPath("/api/redirects/export"));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redirects-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      toast({ title: "Redirects exported" });
    } catch (error) {
      toast({ title: "Failed to export" });
    }
  };

  // Import redirects
  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split("\n").slice(1); // Skip header
      const redirects = lines
        .filter((line) => line.trim())
        .map((line) => {
          const [sourceUrl, destinationUrl, statusCode, , description] = line
            .split(",")
            .map((s) => s.replace(/^"|"$/g, ""));
          return {
            sourceUrl,
            destinationUrl,
            statusCode: parseInt(statusCode) || 301,
            description,
          };
        });

      const res = await fetch(apiPath("/api/redirects/import"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirects }),
      });

      const data = await res.json();
      toast({
        title: `Imported: ${data.summary.success}/${data.summary.total} redirects`,
      });
      queryClient.invalidateQueries({ queryKey: ["redirects"] });

      if (data.summary.errors.length > 0) {
        console.warn("Import errors:", data.summary.errors);
        toast({ title: `${data.summary.errors.length} rows had issues` });
      }
    } catch (error) {
      toast({ title: "Failed to import file" });
    }
  };

  const resetForm = () => {
    setFormData({
      sourceUrl: "",
      destinationUrl: "",
      statusCode: "301",
      description: "",
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (redirect: Redirect) => {
    setFormData({
      sourceUrl: redirect.sourceUrl,
      destinationUrl: redirect.destinationUrl,
      statusCode: redirect.statusCode.toString(),
      description: redirect.description || "",
    });
    setEditingId(redirect.id);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="redirects">Redirects</TabsTrigger>
          <TabsTrigger value="404s">
            404 Errors
            {logsData?.length > 0 && (
              <Badge className="ml-2 bg-red-500">{logsData.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Redirects Tab */}
        <TabsContent value="redirects" className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <Input
              placeholder="Search URLs..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="flex-1 min-w-[250px]"
            />
            <Select
              value={filters.isActive}
              onValueChange={(value) =>
                setFilters({ ...filters, isActive: value })
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus size={16} /> New Redirect
            </Button>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download size={16} /> Export
            </Button>
            <label>
              <Button
                variant="outline"
                className="gap-2"
                onClick={(e) => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".csv";
                  input.onchange = (event: any) => {
                    handleImport(event.target.files[0]);
                  };
                  input.click();
                }}
              >
                <Upload size={16} /> Import
              </Button>
            </label>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Source URL</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-20">Hits</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading redirects...
                    </TableCell>
                  </TableRow>
                ) : redirectsData?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No redirects found
                    </TableCell>
                  </TableRow>
                ) : (
                  redirectsData?.map((redirect: Redirect) => (
                    <TableRow key={redirect.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        <code className="bg-muted px-2 py-1 rounded">
                          {redirect.sourceUrl}
                        </code>
                        {redirect.isAutoDetected && (
                          <Badge className="ml-2 bg-blue-100 text-blue-700">
                            Auto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm truncate">
                        {redirect.destinationUrl}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            redirect.statusCode === 301
                              ? "default"
                              : "secondary"
                          }
                        >
                          {redirect.statusCode}
                        </Badge>
                      </TableCell>
                      <TableCell>{redirect.hitCount}</TableCell>
                      <TableCell>
                        {redirect.isActive ? (
                          <Badge className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(redirect)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(redirect.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 404 Errors Tab */}
        <TabsContent value="404s" className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">
                Unresolved 404 Errors
              </h3>
              <p className="text-sm text-amber-800">
                Create redirects for these missing pages to improve user
                experience
              </p>
            </div>
          </div>

          {analyticsData && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-700 font-medium">
                  Total 404s (30d)
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {analyticsData.total404s}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-700 font-medium">
                  Unresolved
                </div>
                <div className="text-2xl font-bold text-yellow-900">
                  {analyticsData.unresolved}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 font-medium">
                  Resolved
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {analyticsData.resolved}
                </div>
              </div>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Path</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!logsData || logsData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No 404 errors found - Great job!
                    </TableCell>
                  </TableRow>
                ) : (
                  logsData.map((log: NotFoundLog) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        <code className="bg-red-50 px-2 py-1 rounded">
                          {log.path}
                        </code>
                      </TableCell>
                      <TableCell>1</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.occurredAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFormData({
                              sourceUrl: log.path,
                              destinationUrl: "",
                              statusCode: "301",
                              description: "Auto-created from 404",
                            });
                            setActiveTab("redirects");
                            setIsFormOpen(true);
                          }}
                        >
                          Create Redirect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Redirect" : "Create New Redirect"}
            </DialogTitle>
            <DialogDescription>
              Set up a redirect from an old URL to a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                Source URL
              </label>
              <Input
                placeholder="/old-page"
                value={formData.sourceUrl}
                onChange={(e) =>
                  setFormData({ ...formData, sourceUrl: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Destination URL
              </label>
              <Input
                placeholder="/new-page or https://example.com"
                value={formData.destinationUrl}
                onChange={(e) =>
                  setFormData({ ...formData, destinationUrl: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Redirect Type
              </label>
              <Select
                value={formData.statusCode}
                onValueChange={(value) =>
                  setFormData({ ...formData, statusCode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 - Permanent</SelectItem>
                  <SelectItem value="302">302 - Temporary</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Use 301 for permanent moves (better for SEO), 302 for temporary
                redirects
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Description (optional)
              </label>
              <Input
                placeholder="Why this redirect was created..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving..." : "Save Redirect"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
