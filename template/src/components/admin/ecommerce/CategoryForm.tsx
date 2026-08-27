"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { LayoutList, ImageIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Textarea } from "@/src/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
import { toast } from "@/src/hooks/use-toast";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "@/src/lib/apimutation";
import { EcomFormShell } from "./_shared/EcomFormShell";
import { useUnsavedGuard } from "./_shared/useUnsavedGuard";
import { useRouter } from "next/navigation";

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
}

interface Values {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
}

const empty: Values = { name: "", slug: "", description: "", image: "", parentId: "" };

interface Props {
  mode: "create" | "edit";
  id?: string;
}

export function CategoryForm({ mode, id }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Values>(empty);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(mode === "create");

  const { data: catsResp } = useSWR("ecom-categories-all", () =>
    fetchers.productCategories(),
  );
  const allCategories: Category[] = catsResp?.data?.categories ?? catsResp?.data ?? [];
  // Prevent picking self as parent
  const parentChoices = useMemo(
    () => allCategories.filter((c) => c.id !== id),
    [allCategories, id],
  );

  const { data: current } = useSWR(
    mode === "edit" && id ? `ecom-category-${id}` : null,
    () => fetchers.productCategory(id!),
  );

  useEffect(() => {
    if (mode === "edit" && current?.data) {
      const d = current.data as Category;
      setForm({
        name: d.name ?? "",
        slug: d.slug ?? "",
        description: d.description ?? "",
        image: d.image ?? "",
        parentId: d.parentId ?? "",
      });
      setReady(true);
    }
  }, [mode, current]);

  const guard = useUnsavedGuard(form, ready);

  function update<K extends keyof Values>(k: K, v: Values[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function onName(v: string) {
    setForm((prev) => ({
      ...prev,
      name: v,
      slug: slugTouched ? prev.slug : slugify(v),
    }));
  }

  async function submit() {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description || null,
        image: form.image || null,
        parentId: form.parentId || null,
      };
      if (mode === "create") {
        const saved = await apiMutations.createProductCategory(payload);
        toast({ title: "Category created" });
        guard.resetSnapshot(form);
        router.push(`/admin/ecommerce/categories/${saved.data.id}/edit`);
      } else {
        await apiMutations.updateProductCategory(id!, payload);
        toast({ title: "Category updated" });
        guard.resetSnapshot(form);
      }
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message || "Try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <EcomFormShell
      testId="category-form"
      title={mode === "create" ? "New category" : "Edit category"}
      backHref="/admin/ecommerce/categories"
      backLabel="Back to categories"
      icon={<LayoutList className="h-4 w-4 text-primary" />}
      saveLabel={mode === "create" ? "Create category" : "Save changes"}
      onSubmit={submit}
      saving={saving}
      disabled={!form.name.trim()}
      isDirty={guard.isDirty}
      showDiscardDialog={guard.showDiscardDialog}
      onConfirmDiscard={guard.confirmDiscard}
      onCancelDiscard={guard.cancelDiscard}
      attemptBack={guard.attempt}
    >
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Category details</CardTitle>
          <CardDescription className="text-xs">
            Name, slug, hierarchy and image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Name *</Label>
            <Input
              id="c-name"
              value={form.name}
              onChange={(e) => onName(e.target.value)}
              placeholder="e.g. Electronics"
              data-testid="category-name-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-slug">Slug</Label>
            <Input
              id="c-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", slugify(e.target.value));
              }}
              placeholder="electronics"
              data-testid="category-slug-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea
              id="c-desc"
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Short description shown on category pages"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Parent category</Label>
            <Select
              value={form.parentId || "__none"}
              onValueChange={(v) => update("parentId", v === "__none" ? "" : v)}
            >
              <SelectTrigger data-testid="category-parent-select">
                <SelectValue placeholder="No parent (top-level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No parent (top-level)</SelectItem>
                {parentChoices.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-image">Image URL</Label>
            <div className="relative">
              <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="c-image"
                value={form.image}
                onChange={(e) => update("image", e.target.value)}
                placeholder="https://…"
                className="pl-8"
              />
            </div>
            {form.image && (
              <div className="pt-2">
                <img
                  src={form.image}
                  alt=""
                  className="h-24 w-24 object-cover rounded-md border"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </EcomFormShell>
  );
}

export default CategoryForm;
