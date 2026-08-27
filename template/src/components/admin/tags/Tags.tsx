"use client";

// components/tag/tag-table.tsx
import React, { useState, useEffect } from "react";

import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/ui/alert-dialog";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { toast } from "@/src/hooks/use-toast";
import {
  Pencil,
  Trash2,
  Hash,
  Tag as TagIcon,
  Plus,
  RotateCcw,
} from "lucide-react";
import { DataTable, Column } from "@/src/ui/data-table";
import { tagService } from "@/src/services/PostServices";

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: {
    posts: number;
  };
}

export function TagTable() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await tagService.getAll();
      setTags(data);
    } catch (error) {
      console.error("Failed to load tags:", error);
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and slug are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await tagService.update(editingId, formData);
        toast({ title: "Success", description: "Tag updated successfully" });
      } else {
        await tagService.create(formData);
        toast({ title: "Success", description: "Tag created successfully" });
      }
      resetForm();
      loadTags();
    } catch (error: any) {
      console.error("Failed to save tag:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save tag",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;

    try {
      await tagService.delete(tagToDelete.id);
      toast({ title: "Success", description: "Tag deleted successfully" });
      setDeleteDialogOpen(false);
      if (editingId === tagToDelete.id) resetForm();
      loadTags();
    } catch (error: any) {
      console.error("Failed to delete tag:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete tag",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", slug: "" });
    setEditingId(null);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleNameChange = (name: string) => {
    setFormData({
      name,
      slug: editingId ? formData.slug : generateSlug(name),
    });
  };

  const handleEditClick = (tag: Tag) => {
    setEditingId(tag.id);
    setFormData({ name: tag.name, slug: tag.slug });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const columns: Column<Tag>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold
              ${
                editingId === row.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
          >
            #
          </span>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
      filterable: true,
      filterValue: (row) => row.name,
    },
    {
      key: "slug",
      header: "Slug",
      cell: (row) => (
        <code className="text-xs bg-muted px-2 py-1 rounded-md font-mono text-muted-foreground">
          {row.slug}
        </code>
      ),
      filterable: true,
      filterValue: (row) => row.slug,
    },
    {
      key: "posts",
      header: "Posts",
      cell: (row) => (
        <Badge
          variant={row._count?.posts ? "default" : "secondary"}
          className="gap-1"
        >
          {row._count?.posts || 0}
          <span className="font-normal">posts</span>
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditClick(row)}
            className={`h-8 w-8 p-0 transition-colors ${
              editingId === row.id
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "hover:bg-muted"
            }`}
            title="Edit tag"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTagToDelete(row);
              setDeleteDialogOpen(true);
            }}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Delete tag"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <TagIcon className="h-8 w-8 animate-pulse" />
        <p className="text-sm">Loading tags...</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add / Edit Tag Form */}
        <div className="lg:col-span-1">
          <Card
            className={`transition-all duration-200 ${editingId ? "ring-2 ring-primary/30 shadow-md" : ""}`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-md ${editingId ? "bg-primary/10" : "bg-muted"}`}
                >
                  {editingId ? (
                    <Pencil className="h-4 w-4 text-primary" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">
                    {editingId ? "Edit Tag" : "Add New Tag"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {editingId
                      ? "Update the selected tag details"
                      : "Create a new tag for your posts"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., React"
                      className="pl-8"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="e.g., react"
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs — auto-generated from name
                  </p>
                </div>

                <div className={`flex gap-2 pt-1 ${editingId ? "" : ""}`}>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Saving..."
                      : editingId
                        ? "Update Tag"
                        : "Create Tag"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="gap-1.5"
                      title="Discard changes"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  )}
                </div>
              </form>

              {/* Editing indicator */}
              {editingId && (
                <p className="text-xs text-primary mt-3 flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Editing an existing tag
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tags Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Tags</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {tags.length} tag{tags.length !== 1 ? "s" : ""} total
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1.5 font-normal">
                  <TagIcon className="h-3 w-3" />
                  {tags.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={tags}
                columns={columns}
                searchPlaceholder="Search tags..."
                searchKeys={["name", "slug"]}
                pageSize={5}
                emptyMessage="No tags found. Create your first tag using the form."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  You're about to permanently delete{" "}
                  <span className="font-medium text-foreground">
                    "{tagToDelete?.name}"
                  </span>
                  . This action cannot be undone.
                </p>
                {tagToDelete?._count?.posts && tagToDelete._count.posts > 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <span>⚠</span>
                    <span>
                      This tag is used in{" "}
                      <strong>{tagToDelete._count.posts}</strong> post
                      {tagToDelete._count.posts !== 1 ? "s" : ""} and will be
                      removed from them.
                    </span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
