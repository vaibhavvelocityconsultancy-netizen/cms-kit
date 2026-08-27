"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Post } from "./Post.type";
import { postService } from "@/src/services/PostServices";
import { Column, DataTable } from "@/src/ui/data-table";
import { Button } from "@/src/ui/button";
import { PostEditor } from "./PostEditor";
import { toast } from "@/src/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { appUrl } from "@/src/lib/base-path";

export function PostsSection() {
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNewPost, setIsNewPost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-action loading states
  const [savingLoading, setSavingLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // ─── Fetch ──────────────────────────────────────────────

  const { data, isLoading: pageLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => postService.getAll(),
    staleTime: 1000 * 60 * 5,
  });

  const posts = data?.data ?? data ?? [];

  // ─── Handlers ───────────────────────────────────────────

  const handleNew = () => {
    const tempPost: Post = {
      id: `temp-${Date.now()}`,
      title: "Untitled Post",
      slug: "untitled-post",
      content: "",
      status: "DRAFT",
      excerpt: "",
      format: "standard",
      categoryIds: [],
      tagIds: [],
      featuredImage: null,

      seoData: {
        metaTitle: "",
        metaDescription: "",
      },

      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingPost(tempPost);
    setIsNewPost(true);
  };

  const handleEdit = async (id: string) => {
    try {
      setFetchingId(id);

      let full = queryClient.getQueryData(["post", id]) as any;

      if (!full) {
        const res = await postService.getById(id);
        full = res.data?.data ?? res.data ?? res;
      } else {
        full = full.data ?? full;
      }

      setEditingPost({
        ...full,
        categoryIds: full.categories?.map((c: any) => c.id) ?? [],
        tagIds: full.tags?.map((t: any) => t.id) ?? [],
      });

      setIsNewPost(false);
    } finally {
      setFetchingId(null);
    }
  };
  const handleSave = async (status?: string) => {
    if (!editingPost) return;
    try {
      setSavingLoading(true);

      // Strip temp id and frontend-only fields before sending
      const { categoryIds, tagIds, categories, tags, ...rest } =
        editingPost as any;
      const payload: any = {
        ...rest,
        categoryIds: categoryIds ?? [],
        tagIds: tagIds ?? [],
      };
      if (status) payload.status = status;

      let saved: any;
      if (isNewPost) {
        // Remove the temp id — backend will generate real one
        const { id, ...createPayload } = payload;
        const res = await postService.create(createPayload);
        saved = res.data?.data ?? res.data ?? res;
        await queryClient.invalidateQueries({
          queryKey: ["posts"],
        });
        toast({
          title: "Post created!",
          description: "Your new post was created successfully.",
          variant: "success",
        });
      } else {
        const res = await postService.update(editingPost.id, payload);
        saved = res.data?.data ?? res.data ?? res;
        await queryClient.invalidateQueries({
          queryKey: ["posts"],
        });
        toast({
          title: "Post updated!",
          description: "Your changes were saved successfully.",
          variant: "success",
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ["posts"],
      });

      const refreshedPost = {
        ...(saved ?? editingPost),
        categoryIds: (editingPost as any).categoryIds ?? [],
        tagIds: (editingPost as any).tagIds ?? [],
      } as Post;

      setEditingPost(refreshedPost);
      setIsNewPost(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await postService.delete(id);
      await queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
      setDeleteConfirm(null);
      toast({
        title: "Post deleted",
        description: "The post was deleted successfully.",
        variant: "destructive",
      });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error deleting post",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (post: Post) => {
    try {
      setTogglingId(post.id);
      const res =
        post.status === "PUBLISHED"
          ? await postService.unpublish(post.id)
          : await postService.publish(post.id);
      const updated = res.data?.data ?? res.data ?? res;

      toast({
        title: "Success",
        description: `Post ${updated.status === "PUBLISHED" ? "published" : "unpublished"} successfully.`,
        variant: updated.status === "PUBLISHED" ? "success" : "default",
      });
      await queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  // ─── Columns ─────────────────────────────────────────────

  const columns: Column<Post>[] = [
    {
      key: "title",
      header: "Title",
      cell: (row) => (
        <span className="font-medium text-foreground">{row.title}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      cell: (row) => (
        <div className="relative group w-[280px]">
          <button
            onClick={() => window.open(`${appUrl}/posts/${row.slug}`, "_blank")}
            className="block w-full overflow-hidden whitespace-nowrap text-ellipsis text-left font-mono text-xs text-primary hover:underline"
          >
            /posts/{row.slug}
          </button>

          <div className="absolute left-0 top-full z-50 mt-1 hidden w-max max-w-md rounded-md border bg-background p-2 shadow-lg group-hover:block break-all">
            /posts/{row.slug}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      filterValue: (row) => row.status,
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
            row.status === "PUBLISHED"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.status === "PUBLISHED" ? "bg-primary" : "bg-muted-foreground"
            }`}
          />
          {row.status === "PUBLISHED" ? "Published" : "Draft"}
        </span>
      ),
    },
    {
      key: "categories",
      header: "Categories",
      cell: (row) => {
        const cats = (row as any).category ?? [];
        return cats.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {cats.map((c: any) => (
              <span
                key={c.id}
                className="px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded"
              >
                {c.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "publishedAt",
      header: "Published",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.publishedAt
            ? new Date(row.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    // {
    //   key: "updatedAt",
    //   header: "Last Modified",
    //   cell: (row) => (
    //     <span className="font-mono text-xs text-muted-foreground">
    //       {row.updatedAt
    //         ? new Date(row.updatedAt).toLocaleDateString("en-US", {
    //             month: "short",
    //             day: "numeric",
    //             year: "numeric",
    //           })
    //         : "—"}
    //     </span>
    //   ),
    // },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) =>
        deleteConfirm === row.id ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Delete?</span>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-2 text-xs"
              onClick={() => handleDelete(row.id)}
              disabled={deletingId === row.id}
            >
              {deletingId === row.id ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                "Yes"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setDeleteConfirm(null)}
              disabled={deletingId === row.id}
            >
              No
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => handleTogglePublish(row)}
              disabled={togglingId === row.id || fetchingId === row.id}
              className="p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              title={row.status === "PUBLISHED" ? "Unpublish" : "Publish"}
            >
              {togglingId === row.id ? (
                <Loader2 size={15} className="animate-spin" />
              ) : row.status === "PUBLISHED" ? (
                <EyeOff size={15} />
              ) : (
                <Eye size={15} />
              )}
            </button>
            <button
              onMouseEnter={() => {
                queryClient.prefetchQuery({
                  queryKey: ["post", row.id],
                  queryFn: () => postService.getById(row.id),
                  staleTime: 1000 * 60 * 10,
                });
              }}
              onClick={() => handleEdit(row.id)}
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setDeleteConfirm(row.id)}
              disabled={
                deletingId === row.id ||
                fetchingId === row.id ||
                togglingId === row.id
              }
              className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
    },
  ];

  // ─── Render editor ───────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading posts...</p>
      </div>
    );
  }

  if (editingPost) {
    return (
      <PostEditor
        post={editingPost}
        onChange={setEditingPost}
        onSave={handleSave}
        onCancel={() => {
          setEditingPost(null);
          setIsNewPost(false);
        }}
        isLoading={savingLoading}
      />
    );
  }

  // ─── Render list ─────────────────────────────────────────

  return (
    <div className="p-11">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Posts</h1>
          <p className="text-sm font-mono text-muted-foreground">
            {posts.length} post{posts.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <DataTable
        data={posts}
        columns={columns}
        searchPlaceholder="Search posts..."
        searchKeys={["title", "slug"] as any}
        pageSize={10}
        emptyMessage="No posts yet. Create your first post to get started."
        toolbarActions={
          <Button
            onClick={handleNew}
            disabled={savingLoading}
            size="sm"
            className="flex items-center gap-2"
          >
            {savingLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            New Post
          </Button>
        }
      />
    </div>
  );
}
