"use client"
// components/category/category-table.tsx
import React, { useState, useEffect } from 'react';

import { Button } from '@/src/ui/button';
import { Badge } from '@/src/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,  
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/ui/select';
import { Input } from '@/src/ui/input';
import { Label } from '@/src/ui/label';
import { Textarea } from '@/src/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/ui/card';
import { toast } from '@/src/hooks/use-toast';
import { Pencil, Trash2, Plus, RotateCcw, FolderTree } from 'lucide-react';
import { categoryService } from '@/src/services/PostServices';
import { DataTable, Column } from '@/src/ui/data-table';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    posts: number;
  };
}

const NO_PARENT = '__none__';

export function CategoryTable() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '' as string | null,
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter out the current category (and optionally its descendants) from parent options
  const getParentOptions = () => {
    if (!editingId) return categories;
    return categories.filter((c) => c.id !== editingId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and slug are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        parentId: formData.parentId || null,
      };

      if (editingId) {
        await categoryService.update(editingId, payload);
        toast({ title: 'Success', description: 'Category updated successfully', variant: 'success' });
      } else {
        await categoryService.create(payload);
        toast({ title: 'Success', description: 'Category created successfully', variant: 'success' });
      }
      resetForm();
      loadCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await categoryService.delete(categoryToDelete.id);
      toast({ title: 'Success', description: 'Category deleted successfully', variant: 'success' });
      setDeleteDialogOpen(false);
      if (editingId === categoryToDelete.id) resetForm();
      loadCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', parentId: null });
    setEditingId(null);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingId ? formData.slug : generateSlug(name),
    });
  };

  const handleEditClick = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId ?? null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <div>
          <span className="font-medium">{row.name}</span>
          {row.parent && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <FolderTree className="h-3 w-3" />
              {row.parent.name}
            </p>
          )}
        </div>
      ),
      filterable: true,
      filterValue: (row) => row.name,
    },
    {
      key: 'slug',
      header: 'Slug',
      cell: (row) => (
        <code className="text-xs bg-muted px-2 py-1 rounded-md font-mono text-muted-foreground">
          {row.slug}
        </code>
      ),
      filterable: true,
      filterValue: (row) => row.slug,
    },
    {
      key: 'description',
      header: 'Description',
      cell: (row) => (
        <span className="text-muted-foreground text-sm">
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'posts',
      header: 'Posts',
      cell: (row) => (
        <Badge variant={row._count?.posts ? 'default' : 'secondary'} className="gap-1">
          {row._count?.posts || 0}
          <span className="font-normal">posts</span>
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditClick(row)}
            className={`h-8 w-8 p-0 transition-colors ${
              editingId === row.id
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'hover:bg-muted'
            }`}
            title="Edit category"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategoryToDelete(row);
              setDeleteDialogOpen(true);
            }}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Delete category"
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
        <FolderTree className="h-8 w-8 animate-pulse" />
        <p className="text-sm">Loading categories...</p>
      </div>
    );
  }

  const parentOptions = getParentOptions();

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 max-w-5xl mx-auto">

        {/* Add / Edit Category Form */}
        <div className="lg:col-span-1">
          <Card className={`transition-all duration-200 ${editingId ? 'ring-2 ring-primary/30 shadow-md' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${editingId ? 'bg-primary/10' : 'bg-muted'}`}>
                  {editingId
                    ? <Pencil className="h-4 w-4 text-primary" />
                    : <Plus className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
                <div>
                  <CardTitle className="text-base">
                    {editingId ? 'Edit Category' : 'Add New Category'}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {editingId
                      ? 'Update the selected category'
                      : 'Create a new category to organize your posts'}
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
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Technology"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., technology"
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs — auto-generated from name
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this category"
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Parent Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="parentId" className="text-sm font-medium">
                    Parent Category
                  </Label>
                  <Select
                    key={editingId ?? "new-category"}
                    value={formData.parentId ?? NO_PARENT}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        parentId: val === NO_PARENT ? null : val,
                      })
                    }
                  >
                    <SelectTrigger id="parentId" className="w-full">
                      <SelectValue placeholder="None (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT}>
                        <span className="text-muted-foreground">None (top-level)</span>
                      </SelectItem>
                      {parentOptions.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1">
                            Categories
                          </div>
                          {parentOptions.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Optional — nest this under another category
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting
                      ? 'Saving...'
                      : editingId ? 'Update Category' : 'Create Category'
                    }
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

              {editingId && (
                <p className="text-xs text-primary mt-3 flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Editing an existing category
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Categories</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} total
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1.5 font-normal">
                  <FolderTree className="h-3 w-3" />
                  {categories.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={categories}
                columns={columns}
                searchPlaceholder="Search categories..."
                searchKeys={['name', 'slug', 'description']}
                pageSize={5}
                emptyMessage="No categories found. Create your first category using the form."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  You're about to permanently delete{' '}
                  <span className="font-medium text-foreground">"{categoryToDelete?.name}"</span>.
                  This action cannot be undone.
                </p>
                {categoryToDelete?._count?.posts && categoryToDelete._count.posts > 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <span>⚠</span>
                    <span>
                      This category has{' '}
                      <strong>{categoryToDelete._count.posts}</strong> post
                      {categoryToDelete._count.posts !== 1 ? 's' : ''} that may be affected.
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
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}