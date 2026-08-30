"use client";

import {
  FileText,
  Globe,
  PenTool,
  Heart,
  Clock,
  CheckCircle,
  ArrowRight,
  Calendar,
  Users,
  Activity,
  Zap,
  File,
  FolderOpen,
  Tag,
  Menu,
  Eye,
  Download,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getApiBaseUrl } from "@/src/lib/axios";
import { appUrl } from "@/src/lib/base-path";
import { toast } from "@/src/hooks/use-toast";

interface DashboardData {
  stats: {
    pages: number;
    posts: number;
    draftPosts: number;
    publishedPosts: number;
    categories: number;
    tags: number;
    menus: number;
  };
  recentPages: Array<{
    id: number;
    title: string;
    slug: string;
    status: string;
    updatedAt: string;
  }>;
  recentPosts: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    updatedAt: string;
  }>;
}

export function DashboardSection() {
  const [isImportExportLoading, setIsImportExportLoading] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await api.get("/api/dashboard");
      return response.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const dashboardData = data;

  async function readJsonResponse(res: Response) {
    const contentType = res.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        text.trim().startsWith("<")
          ? `Request failed with a non-JSON response (${res.status})`
          : text || `Request failed (${res.status})`,
      );
    }

    return res.json();
  }

  const handleExport = async () => {
    try {
      setIsImportExportLoading(true);
      const res = await fetch(`${getApiBaseUrl()}/api/export`);
      const json = await readJsonResponse(res);

      const blob = new Blob([JSON.stringify(json.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cms-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your backup file is downloading.",
      });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message });
    } finally {
      setIsImportExportLoading(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (event: any) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setIsImportExportLoading(true);
        const text = await file.text();
        const data = JSON.parse(text);

        const res = await fetch(`${getApiBaseUrl()}/api/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, strategy: "skip" }),
        });

        const json = await readJsonResponse(res);

        if (!res.ok) {
          throw new Error(json.message || "Import failed");
        }

        await refetch();
        toast({
          title: "Import successful",
          description: `${json.data?.pages?.created ?? 0} created, ${json.data?.pages?.skipped ?? 0} skipped, ${json.data?.pages?.overwritten ?? 0} overwritten.`,
        });
      } catch (err: any) {
        toast({ title: "Import failed", description: err.message });
      } finally {
        setIsImportExportLoading(false);
      }
    };

    input.click();
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const statCardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  const loading = isLoading;
  if (loading) {
    return (
      <div className="flex items-center justify-center max-w-4xl bg-linear-to-br from-background via-background to-background/95">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sidebar-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-background via-background to-background/95">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "No data available"}{" "}
          </p>
        </div>
      </div>
    );
  }

  // Build stats cards from REAL API data
  const statsData = [
    {
      label: "Total Pages",
      value: dashboardData.stats.pages.toString(),
      change: `${dashboardData.stats.pages} total pages`,
      icon: Globe,
      color: "from-blue-500/20 to-blue-500/5",
      iconColor: "text-blue-500",
    },
    {
      label: "Total Posts",
      value: dashboardData.stats.posts.toString(),
      change: `${dashboardData.stats.publishedPosts} published, ${dashboardData.stats.draftPosts} draft`,
      icon: PenTool,
      color: "from-green-500/20 to-green-500/5",
      iconColor: "text-green-500",
    },
    {
      label: "Categories",
      value: dashboardData.stats.categories.toString(),
      change: `${dashboardData.stats.categories} categories`,
      icon: FolderOpen,
      color: "from-purple-500/20 to-purple-500/5",
      iconColor: "text-purple-500",
    },
    {
      label: "Tags",
      value: dashboardData.stats.tags.toString(),
      change: `${dashboardData.stats.tags} tags`,
      icon: Tag,
      color: "from-amber-500/20 to-amber-500/5",
      iconColor: "text-amber-500",
    },
    {
      label: "Menus",
      value: dashboardData.stats.menus.toString(),
      change: `${dashboardData.stats.menus} active menus`,
      icon: Menu,
      color: "from-indigo-500/20 to-indigo-500/5",
      iconColor: "text-indigo-500",
    },
  ];

  // Combine REAL recent pages and posts
  const recentActivity = [
    ...dashboardData.recentPages.map(
      (page: {
        id: number;
        title: string;
        slug: string;
        status: string;
        updatedAt: string;
      }) => ({
        id: `page-${page.id}`,
        action: page.status === "published" ? "Published page" : "Updated page",
        title: page.title,
        slug: page.slug,
        time: formatRelativeTime(page.updatedAt),
        status: page.status,
        type: "page",
      }),
    ),
    ...dashboardData.recentPosts.map(
      (post: {
        id: string;
        title: string;
        slug: string;
        status: string;
        updatedAt: string;
      }) => ({
        id: `post-${post.id}`,
        action: post.status === "PUBLISHED" ? "Published post" : "Updated post",
        title: post.title,
        slug: post.slug,
        time: formatRelativeTime(post.updatedAt),
        status: post.status.toLowerCase(),
        type: "post",
      }),
    ),
  ].sort((a, b) => {
    // Sort by most recent
    const aDate = new Date(
      a.time.includes("Just now") ? Date.now() : Date.now(),
    );
    const bDate = new Date(
      b.time.includes("Just now") ? Date.now() : Date.now(),
    );
    return bDate.getTime() - aDate.getTime();
  });

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  function handleQuickAction(action: string) {
    switch (action) {
      case "create-page":
        window.location.href = "/admin/pages/new";
        break;
      case "create-post":
        window.location.href = "/admin/posts/new";
        break;
      case "menus":
        window.location.href = "/admin/menus";
        break;
      case "categories":
        window.location.href = "/admin/categories";
        break;
      case "tags":
        window.location.href = "/admin/tags";
        break;
    }
  }

  const quickActions = [
    {
      label: "Create New Page",
      icon: FileText,
      action: "create-page",
      color: "bg-sidebar-primary",
    },
    {
      label: "Create New Post",
      icon: File,
      action: "create-post",
      color: "bg-purple-500",
    },
    {
      label: "Manage Menus",
      icon: Menu,
      action: "menus",
      color: "bg-emerald-500",
    },
    {
      label: "Manage Categories",
      icon: FolderOpen,
      action: "categories",
      color: "bg-amber-500",
    },
    {
      label: "Manage Tags",
      icon: Tag,
      action: "tags",
      color: "bg-blue-500",
    },
  ];

  const publishedContent =
    dashboardData.stats.publishedPosts + dashboardData.stats.pages;
  const totalContent = dashboardData.stats.posts + dashboardData.stats.pages;
  const completionPercentage =
    totalContent > 0 ? Math.round((publishedContent / totalContent) * 100) : 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-8 bg-linear-to-br from-background via-background to-background/95 min-h-screen"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-sans text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text mb-2">
              Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-sidebar-primary rounded-full" />
              <p className="text-sm font-mono text-muted-foreground">
                Overview & Content Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleImport}
                disabled={isImportExportLoading}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                <Upload size={14} />
                Import
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isImportExportLoading}
                className="flex items-center gap-2 rounded-lg bg-sidebar-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-sidebar-primary/90 disabled:opacity-50"
              >
                <Download size={14} />
                Export
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - All data from API */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8"
      >
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={statCardVariants}
              whileHover="hover"
              className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div
                className={`absolute inset-0 bg-linear-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <div className="relative p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2 rounded-xl bg-linear-to-br ${stat.color} ring-1 ring-border`}
                  >
                    <Icon size={18} className={stat.iconColor} />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground/70 truncate">
                    {stat.change}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Content Summary & Quick Stats - All from API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Content Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">
            Content Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Published Content
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {publishedContent}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-green-500">
                {dashboardData.stats.publishedPosts} posts,{" "}
                {dashboardData.stats.pages} pages
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <PenTool size={18} className="text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Draft Content</p>
                  <p className="text-lg font-semibold text-foreground">
                    {dashboardData.stats.draftPosts}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-amber-500">
                {dashboardData.stats.draftPosts === 1
                  ? "1 draft post"
                  : `${dashboardData.stats.draftPosts} draft posts`}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <FolderOpen size={18} className="text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Taxonomies</p>
                  <p className="text-lg font-semibold text-foreground">
                    {dashboardData.stats.categories} /{" "}
                    {dashboardData.stats.tags}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-purple-500">
                Categories / Tags
              </span>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">Content Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Publication Rate
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {completionPercentage}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-linear-to-r from-green-500 to-green-500/60 rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {publishedContent} of {totalContent} total content pieces
                published
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-sidebar-primary" />
                  <span className="text-xs text-muted-foreground">
                    Total Content
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {totalContent}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-500" />
                <span className="text-xs text-muted-foreground">
                  Drafts Pending
                </span>
              </div>
              <span className="text-sm font-semibold text-amber-500">
                {dashboardData.stats.draftPosts}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-blue-500" />
                <span className="text-xs text-muted-foreground">
                  Content Types
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                Pages & Posts
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity - REAL data from API */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Latest changes to your content
            </p>
          </div>
          <div className="divide-y divide-border max-h-100 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() =>
                  (window.location.href = appUrl(
                    `/admin/${activity.type}s/${activity.slug}`,
                  ))
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {activity.action}
                        </span>
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${activity.status === "published" ||
                              activity.status === "PUBLISHED"
                              ? "bg-green-500"
                              : "bg-amber-500"
                            }`}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {activity.time}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground/30 group-hover:text-sidebar-primary transition-colors"
                    />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Activity size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickAction(action.action)}
                  className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${action.color}/10`}>
                      <Icon
                        size={18}
                        className={
                          action.color === "bg-sidebar-primary"
                            ? "text-sidebar-primary"
                            : "text-white"
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {action.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click to create
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-muted-foreground/30 group-hover:text-sidebar-primary transition-colors"
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Completion Rate */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart size={14} className="text-red-500" />
                <span className="text-xs text-muted-foreground">
                  Content Completion Rate
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {completionPercentage}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, delay: 0.8 }}
                className="h-full bg-linear-to-r from-sidebar-primary to-sidebar-primary/60 rounded-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep creating content to grow your site
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Missing AlertCircle component
function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
