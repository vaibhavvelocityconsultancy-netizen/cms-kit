"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Percent, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/src/ui/switch";
import { toast } from "@/src/hooks/use-toast";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "@/src/lib/apimutation";
import { EcomFormShell } from "./_shared/EcomFormShell";
import { useUnsavedGuard } from "./_shared/useUnsavedGuard";

interface Rate {
  id?: string;
  country: string;
  state: string;
  rate: number;
  isInclusive: boolean;
}
interface Values {
  name: string;
  rates: Rate[];
}
const empty: Values = { name: "", rates: [] };

export function TaxForm({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Values>(empty);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(mode === "create");

  const { data } = useSWR(mode === "edit" && id ? `ecom-tax-${id}` : null, () => fetchers.taxClass(id!));
  useEffect(() => {
    if (mode === "edit" && data?.data) {
      const d = data.data;
      setForm({
        name: d.name ?? "",
        rates: (d.rates ?? []).map((r: any) => ({
          id: r.id,
          country: r.country ?? "",
          state: r.state ?? "",
          rate: Number(r.rate ?? 0),
          isInclusive: Boolean(r.isInclusive),
        })),
      });
      setReady(true);
    }
  }, [mode, data]);

  const guard = useUnsavedGuard(form, ready);

  function addRate() {
    setForm((p) => ({
      ...p,
      rates: [...p.rates, { country: "", state: "", rate: 0, isInclusive: false }],
    }));
  }
  function updateRate<K extends keyof Rate>(i: number, k: K, v: Rate[K]) {
    setForm((p) => ({ ...p, rates: p.rates.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)) }));
  }
  function removeRate(i: number) {
    setForm((p) => ({ ...p, rates: p.rates.filter((_, idx) => idx !== i) }));
  }

  async function submit() {
    if (!form.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), rates: form.rates.filter((r) => r.country.trim()) };
      if (mode === "create") {
        const saved = await apiMutations.createTaxClass(payload);
        toast({ title: "Tax class created" });
        guard.resetSnapshot(form);
        router.push(`/admin/ecommerce/taxes/${saved.data.id}/edit`);
      } else {
        await apiMutations.updateTaxClass(id!, payload);
        toast({ title: "Tax class updated" });
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
      testId="tax-form"
      title={mode === "create" ? "New tax class" : "Edit tax class"}
      backHref="/admin/ecommerce/taxes"
      backLabel="Back to taxes"
      icon={<Percent className="h-4 w-4 text-primary" />}
      saveLabel={mode === "create" ? "Create tax class" : "Save changes"}
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
          <CardTitle className="text-base">Tax class</CardTitle>
          <CardDescription className="text-xs">Group tax rates under a class name (e.g. GST, VAT)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. GST 18%"
              data-testid="tax-name-input"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Rates</CardTitle>
              <CardDescription className="text-xs">
                Rates by country/state. Inclusive rates are baked into the price.
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
                <div className="space-y-1">
                  <Label className="text-xs">Country *</Label>
                  <Input
                    value={r.country}
                    onChange={(e) => updateRate(i, "country", e.target.value.toUpperCase())}
                    placeholder="IN"
                    className="h-8 font-mono uppercase"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">State (optional)</Label>
                  <Input
                    value={r.state}
                    onChange={(e) => updateRate(i, "state", e.target.value)}
                    placeholder="Any"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rate (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={r.rate}
                    onChange={(e) => updateRate(i, "rate", Math.max(0, Number(e.target.value)))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Inclusive?</Label>
                  <div className="h-8 flex items-center">
                    <Switch
                      checked={r.isInclusive}
                      onCheckedChange={(v: boolean) => updateRate(i, "isInclusive", v)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
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

export default TaxForm;
