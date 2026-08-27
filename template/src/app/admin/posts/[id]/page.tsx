"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PostEditor } from "@/src/components/admin/posts/PostEditor";
import { Post } from "@/src/components/admin/posts/Post.type";
import { postService } from "@/src/services/PostServices";

export default function AdminPostEditorRoute() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        const res = await postService.getById(params.id);
        const full = res.data?.data ?? res.data ?? res;
        setPost({
          ...full,
          categoryIds:
            full.categories?.map((category: any) => category.id) ?? [],
          tagIds: full.tags?.map((tag: any) => tag.id) ?? [],
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadPost();
  }, [params.id]);

  const handleSave = async (status?: string) => {
    if (!post) return;

    const { categoryIds, tagIds, categories, tags, ...rest } = post as any;
    const payload: any = {
      ...rest,
      categoryIds: categoryIds ?? [],
      tagIds: tagIds ?? [],
    };
    if (status) payload.status = status;
    const res = await postService.update(post.id, payload);
    const updated = res.data?.data ?? res.data ?? res;
    setPost({
      ...updated,
      categoryIds:
        updated.categories?.map((category: any) => category.id) ?? [],
      tagIds: updated.tags?.map((tag: any) => tag.id) ?? [],
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading post...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Post unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || "The requested post could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PostEditor
      post={post}
      onChange={setPost}
      onSave={handleSave}
      onCancel={() => router.push("/admin")}
    />
  );
}
