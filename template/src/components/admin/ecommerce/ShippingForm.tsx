"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Truck, Plus, Trash2, X } from "lucide-react";
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
import { Badge } from "@/src/ui/badge";
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
import { formatMoney } from "@/src/lib/ecom/format";

// Common country codes (ISO-3166 subset — extend as needed)
const COUNTRY_OPTIONS = [
  "IN", "US", "GB", "CA", "AU", "AE", "SG", "MY", "DE", "FR", "IT", "ES", "NL", "SE", "NO", "FI",
  "NZ", "JP", "CN", "HK", "KR", "ZA", "BR", "MX", "CL", "AR",
];

interface Rate {
  id?: string;
  name: string;
  type: "FLAT" | "FREE";
  cost: number;
  minOrderValue: number | null;
}
interface Values {
  name: string;
  countries: string[];
  rates: Rate[];
}
const empty: Values = { name: "", countries: [], rates: [] };

export function ShippingForm({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const { settings } = useEcomSettings();
  const [form, setForm] = useState<Values>(empty);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(mode === "create");

  const { data } = useSWR(mode === "edit" && id ? `ecom-zone-${id}` : null, () => fetchers.shippingZone(id!));
  useEffect(() => {
    if (mode === "edit" && data?.data) {
      const d = data.data;
      setForm({
        name: d.name ?? "",
        countries: Array.isArray(d.countries) ? d.countries : [],
        rates: (d.rates ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          cost: Number(r.cost ?? 0),
          minOrderValue: r.minOrderValue == null ? null : Number(r.minOrderValue),
        })),
      });
      setReady(true);
    }
  }, [mode, data]);

  const guard = useUnsavedGuard(form, ready);

  function toggleCountry(code: string) {
    setForm((prev) => ({
      ...prev,
      countries: prev.countries.includes(code)
        ? prev.countries.filter((c) => c !== code)
        : [...prev.countries, code],
    }));
  }
  function addRate() {
    setForm((prev) => ({
      ...prev,
      rates: [...prev.rates, { name: "", type: "FLAT", cost: 0, minOrderValue: null }],
    }));
  }
  function updateRate<K extends keyof Rate>(i: number, k: K, v: Rate[K]) {
    setForm((prev) => ({
      ...prev,
      rates: prev.rates.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
    }));
  }
  function removeRate(i: number) {
    setForm((prev) => ({ ...prev, rates: prev.rates.filter((_, idx) => idx !== i) }));
  }

  async function submit() {
    if (!form.name.trim()) return toast({ title: "Zone name is required", variant: "destructive" });
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        countries: form.countries,
        rates: form.rates.filter((r) => r.name.trim()),
      };
      if (mode === "create") {
        const saved = await apiMutations.createShippingZone(payload);
        toast({ title: "Zone created" });
        guard.resetSnapshot(form);
        router.push(`/admin/ecommerce/shipping/${saved.data.id}/edit`);
      } else {
        await apiMutations.updateShippingZone(id!, payload);
        toast({ title: "Zone updated" });
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
      testId="shipping-form"
      title={mode === "create" ? "New shipping zone" : "Edit shipping zone"}
      backHref="/admin/ecommerce/shipping"
      backLabel="Back to shipping"
      icon={<Truck className="h-4 w-4 text-primary" />}
      saveLabel={mode === "create" ? "Create zone" : "Save changes"}
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
          <CardTitle className="text-base">Zone</CardTitle>
          <CardDescription className="text-xs">Name and countries this zone covers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. India, Domestic"
              data-testid="zone-name-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Countries</Label>
            <div className="flex flex-wrap gap-1.5 pb-2">
              {form.countries.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No countries selected — this zone will apply to any address.
                </span>
              )}
              {form.countries.map((c) => (
                <Badge key={c} variant="secondary" className="gap-1 pl-2 pr-1">
                  {c}
                  <button
                    type="button"
                    onClick={() => toggleCountry(c)}
                    className="hover:bg-background/60 rounded p-0.5"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COUNTRY_OPTIONS.filter((c) => !form.countries.includes(c)).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCountry(c)}
                  className="text-xs px-2 py-1 rounded border hover:bg-muted"
                >
                  + {c}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Rates</CardTitle>
              <CardDescription className="text-xs">
                Add flat rates or free-shipping thresholds
              </CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addRate}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add rate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.rates.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No rates yet.</p>
          )}
          {form.rates.map((r, i) => (
            <div key={r.id ?? `new-${i}`} className="rounded-md border p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Rate name</Label>
                  <Input
                    value={r.name}
                    onChange={(e) => updateRate(i, "name", e.target.value)}
                    placeholder="Standard delivery"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={r.type} onValueChange={(v) => updateRate(i, "type", v as "FLAT" | "FREE")}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">Flat rate</SelectItem>
                      <SelectItem value="FREE">Free shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    {r.type === "FREE" ? "Min order for free" : `Cost (${settings.currency})`}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-8"
                    value={r.type === "FREE" ? (r.minOrderValue ?? "") : r.cost}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Math.max(0, Number(e.target.value));
                      if (r.type === "FREE") updateRate(i, "minOrderValue", v);
                      else updateRate(i, "cost", v ?? 0);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Preview:{" "}
                  {r.type === "FREE"
                    ? `Free above ${formatMoney(r.minOrderValue ?? 0, settings.currency)}`
                    : formatMoney(r.cost, settings.currency)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRate(i)}
                  className="h-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </EcomFormShell>
  );
}

export default ShippingForm;
