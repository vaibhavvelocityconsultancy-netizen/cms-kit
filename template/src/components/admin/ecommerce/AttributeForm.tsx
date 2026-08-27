"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { SlidersHorizontal, Plus, Trash2, GripVertical } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Button } from "@/src/ui/button";
import { toast } from "@/src/hooks/use-toast";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "@/src/lib/apimutation";
import { EcomFormShell } from "./_shared/EcomFormShell";
import { useUnsavedGuard } from "./_shared/useUnsavedGuard";

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

interface AttributeValue {
  id?: string;
  value: string;
}
interface Values {
  name: string;
  slug: string;
  values: AttributeValue[];
}
const empty: Values = { name: "", slug: "", values: [{ value: "" }] };

export function AttributeForm({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Values>(empty);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(mode === "create");
  const dragIdx = useRef<number | null>(null);

  const { data } = useSWR(mode === "edit" && id ? `ecom-attribute-${id}` : null, () => fetchers.attribute(id!));
  useEffect(() => {
    if (mode === "edit" && data?.data) {
      const d = data.data;
      setForm({
        name: d.name ?? "",
        slug: d.slug ?? "",
        values: (d.values ?? []).map((v: any) => ({ id: v.id, value: v.value })),
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
  function addValue() {
    setForm((prev) => ({ ...prev, values: [...prev.values, { value: "" }] }));
  }
  function updateValue(i: number, v: string) {
    setForm((prev) => ({
      ...prev,
      values: prev.values.map((val, idx) => (idx === i ? { ...val, value: v } : val)),
    }));
  }
  function removeValue(i: number) {
    setForm((prev) => ({ ...prev, values: prev.values.filter((_, idx) => idx !== i) }));
  }
  function onDrop(target: number) {
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from == null || from === target) return;
    setForm((prev) => {
      const next = [...prev.values];
      const [m] = next.splice(from, 1);
      next.splice(target, 0, m);
      return { ...prev, values: next };
    });
  }

  async function submit() {
    if (!form.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    const cleanValues = form.values.filter((v) => v.value.trim());
    if (cleanValues.length === 0)
      return toast({ title: "Add at least one value", variant: "destructive" });

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        values: cleanValues.map((v, i) => ({ id: v.id, value: v.value.trim(), sortOrder: i })),
      };
      if (mode === "create") {
        const saved = await apiMutations.createAttribute(payload);
        toast({ title: "Attribute created" });
        guard.resetSnapshot(form);
        router.push(`/admin/ecommerce/attributes/${saved.data.id}/edit`);
      } else {
        await apiMutations.updateAttribute(id!, payload);
        toast({ title: "Attribute updated" });
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
      testId="attribute-form"
      title={mode === "create" ? "New attribute" : "Edit attribute"}
      backHref="/admin/ecommerce/attributes"
      backLabel="Back to attributes"
      icon={<SlidersHorizontal className="h-4 w-4 text-primary" />}
      saveLabel={mode === "create" ? "Create attribute" : "Save changes"}
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
          <CardTitle className="text-base">Attribute</CardTitle>
          <CardDescription className="text-xs">Name and slug</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => onName(e.target.value)} data-testid="attribute-name-input" />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", slugify(e.target.value));
              }}
              data-testid="attribute-slug-input"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Values</CardTitle>
              <CardDescription className="text-xs">
                Add each possible value (e.g. Small, Medium, Large). Drag to reorder.
              </CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addValue} data-testid="attribute-add-value-btn">
              <Plus className="h-4 w-4 mr-1.5" />
              Add value
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {form.values.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">No values yet.</p>
          )}
          {form.values.map((v, i) => (
            <div
              key={v.id ?? `new-${i}`}
              draggable
              onDragStart={() => (dragIdx.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className="flex items-center gap-2 rounded-md border bg-card p-2"
              data-testid={`attribute-value-row-${i}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
              <Input
                value={v.value}
                onChange={(e) => updateValue(i, e.target.value)}
                placeholder={`Value ${i + 1}`}
                data-testid={`attribute-value-input-${i}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeValue(i)}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                data-testid={`attribute-value-remove-${i}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </EcomFormShell>
  );
}

export default AttributeForm;
