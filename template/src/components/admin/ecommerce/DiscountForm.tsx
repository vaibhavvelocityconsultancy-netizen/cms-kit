"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Percent } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Switch } from "@/src/ui/switch";
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
import { useEcomSettings } from "@/src/lib/ecom/useEcomSettings";

interface Values {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderValue: number | null;
  maxUses: number | null;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
}
const empty: Values = {
  code: "",
  type: "PERCENTAGE",
  value: 10,
  minOrderValue: null,
  maxUses: null,
  isActive: true,
  startsAt: "",
  expiresAt: "",
};

function toInputDate(v: string | null | undefined) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

export function DiscountForm({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const { settings } = useEcomSettings();
  const [form, setForm] = useState<Values>(empty);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(mode === "create");

  const { data } = useSWR(mode === "edit" && id ? `ecom-coupon-${id}` : null, () => fetchers.coupon(id!));
  useEffect(() => {
    if (mode === "edit" && data?.data) {
      const d = data.data;
      setForm({
        code: d.code ?? "",
        type: d.type === "FIXED" ? "FIXED" : "PERCENTAGE",
        value: Number(d.value ?? 0),
        minOrderValue: d.minOrderValue == null ? null : Number(d.minOrderValue),
        maxUses: d.maxUses == null ? null : Number(d.maxUses),
        isActive: Boolean(d.isActive),
        startsAt: toInputDate(d.startsAt),
        expiresAt: toInputDate(d.expiresAt),
      });
      setReady(true);
    }
  }, [mode, data]);

  const guard = useUnsavedGuard(form, ready);

  function update<K extends keyof Values>(k: K, v: Values[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function submit() {
    if (!form.code.trim()) return toast({ title: "Code is required", variant: "destructive" });
    if (form.type === "PERCENTAGE" && (form.value <= 0 || form.value > 100))
      return toast({ title: "Percentage must be 1–100", variant: "destructive" });
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: form.value,
        minOrderValue: form.minOrderValue,
        maxUses: form.maxUses,
        isActive: form.isActive,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
      };
      if (mode === "create") {
        const saved = await apiMutations.createCoupon(payload);
        toast({ title: "Coupon created" });
        guard.resetSnapshot(form);
        router.push(`/admin/ecommerce/discounts/${saved.data.id}/edit`);
      } else {
        await apiMutations.updateCoupon(id!, payload);
        toast({ title: "Coupon updated" });
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
      testId="discount-form"
      title={mode === "create" ? "New discount" : "Edit discount"}
      backHref="/admin/ecommerce/discounts"
      backLabel="Back to discounts"
      icon={<Percent className="h-4 w-4 text-primary" />}
      saveLabel={mode === "create" ? "Create discount" : "Save changes"}
      onSubmit={submit}
      saving={saving}
      disabled={!form.code.trim()}
      isDirty={guard.isDirty}
      showDiscardDialog={guard.showDiscardDialog}
      onConfirmDiscard={guard.confirmDiscard}
      onCancelDiscard={guard.cancelDiscard}
      attemptBack={guard.attempt}
    >
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Coupon</CardTitle>
          <CardDescription className="text-xs">Code and discount value</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Code *</Label>
            <Input
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              placeholder="SUMMER25"
              className="uppercase font-mono"
              data-testid="discount-code-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v as any)}>
                <SelectTrigger data-testid="discount-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FIXED">Fixed amount ({settings.currency})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Value *</Label>
              <Input
                type="number"
                min={0}
                step={form.type === "PERCENTAGE" ? "1" : "0.01"}
                value={form.value}
                onChange={(e) => update("value", Math.max(0, Number(e.target.value)))}
                data-testid="discount-value-input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Min order value ({settings.currency})</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.minOrderValue ?? ""}
                onChange={(e) => update("minOrderValue", e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
                placeholder="No minimum"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max uses</Label>
              <Input
                type="number"
                min={0}
                value={form.maxUses ?? ""}
                onChange={(e) => update("maxUses", e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
                placeholder="Unlimited"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Starts at</Label>
              <Input type="date" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Expires at</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => update("expiresAt", e.target.value)} />
            </div>
          </div>
          <label className="flex items-center justify-between rounded-md py-2 px-3 cursor-pointer hover:bg-muted/50">
            <div>
              <span className="block text-sm font-medium">Active</span>
              <span className="block text-xs text-muted-foreground">Uncheck to disable the coupon</span>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v: boolean) => update("isActive", v)} />
          </label>
        </CardContent>
      </Card>
    </EcomFormShell>
  );
}

export default DiscountForm;
