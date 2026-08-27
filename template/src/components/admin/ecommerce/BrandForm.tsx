"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Tag, ImageIcon } from "lucide-react";
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
import { toast } from "@/src/hooks/use-toast";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "@/src/lib/apimutation";
import { EcomFormShell } from "./_shared/EcomFormShell";
import { useUnsavedGuard } from "./_shared/useUnsavedGuard";

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

interface Values {
  name: string;
  slug: string;
  logo: string;
  description: string;
}
const empty: Values = { name: "", slug: "", logo: "", description: "" };

export function BrandForm({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Values>(empty);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(mode === "create");

  const { data } = useSWR(mode === "edit" && id ? `ecom-brand-${id}` : null, () => fetchers.brand(id!));
  useEffect(() => {
    if (mode === "edit" && data?.data) {
      const d = data.data;
      setForm({
        name: d.name ?? "",
        slug: d.slug ?? "",
        logo: d.logo ?? "",
        description: d.description ?? "",
      });
      setReady(true);
    }
  }, [mode, data]);

  const guard = useUnsavedGuard(form, ready);

  function update<K extends keyof Values>(k: K, v: Values[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }
  function onName(v: string) {
    setForm((prev) => ({ ...prev, name: v, slug: slugTouched ? prev.slug : slugify(v) }));
  }

  async function submit() {
    if (!form.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        logo: form.logo || null,
        description: form.description || null,
      };
      if (mode === "create") {
        const saved = await apiMutations.createBrand(payload);
        toast({ title: "Brand created" });
        guard.resetSnapshot(form);
        router.push(`/admin/ecommerce/brands/${saved.data.id}/edit`);
      } else {
        await apiMutations.updateBrand(id!, payload);
        toast({ title: "Brand updated" });
        guard.resetSnapshot(form);
      }
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <EcomFormShell
      testId="brand-form"
      title={mode === "create" ? "New brand" : "Edit brand"}
      backHref="/admin/ecommerce/brands"
      backLabel="Back to brands"
      icon={<Tag className="h-4 w-4 text-primary" />}
      saveLabel={mode === "create" ? "Create brand" : "Save changes"}
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
          <CardTitle className="text-base">Brand details</CardTitle>
          <CardDescription className="text-xs">Name, slug, logo and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="b-name">Name *</Label>
            <Input id="b-name" value={form.name} onChange={(e) => onName(e.target.value)} data-testid="brand-name-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-slug">Slug</Label>
            <Input
              id="b-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", slugify(e.target.value));
              }}
              data-testid="brand-slug-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-logo">Logo URL</Label>
            <div className="relative">
              <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="b-logo"
                value={form.logo}
                onChange={(e) => update("logo", e.target.value)}
                placeholder="https://…"
                className="pl-8"
              />
            </div>
            {form.logo && (
              <div className="pt-2">
                <img src={form.logo} alt="" className="h-20 w-20 object-contain rounded-md border bg-muted/30 p-2" />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-desc">Description</Label>
            <Textarea
              id="b-desc"
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </EcomFormShell>
  );
}

export default BrandForm;
