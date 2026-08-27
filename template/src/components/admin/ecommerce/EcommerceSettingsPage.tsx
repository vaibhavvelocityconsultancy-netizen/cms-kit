"use client";
import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  Store,
  CreditCard,
  ShoppingCart,
  Eye,
  EyeOff,
  SlidersHorizontal,
} from "lucide-react";
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
import { Textarea } from "@/src/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
import { toast } from "@/src/hooks/use-toast";
import { apiMutations } from "@/src/lib/apimutation";
import { useEcomSettings } from "@/src/lib/ecom/useEcomSettings";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD"];
const WEIGHT_UNITS = ["kg", "g", "lb", "oz"];
const DIMENSION_UNITS = ["cm", "mm", "in"];

type Tab = "general" | "checkout" | "payments";

interface StoreAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface FormState {
  currency: string;
  weightUnit: string;
  dimensionUnit: string;
  storeAddress: StoreAddress;
  guestCheckoutEnabled: boolean;
  termsRequired: boolean;
  orderNumberPrefix: string;
  codEnabled: boolean;
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  razorpayKeySecret: string;
}

export function EcommerceSettingsPage() {
  const { settings, isLoading, mutate } = useEcomSettings();
  const [tab, setTab] = useState<Tab>("general");
  const [form, setForm] = useState<FormState>({
    currency: "INR",
    weightUnit: "kg",
    dimensionUnit: "cm",
    storeAddress: {},
    guestCheckoutEnabled: true,
    termsRequired: false,
    orderNumberPrefix: "ORD-",
    codEnabled: true,
    razorpayEnabled: true,
    razorpayKeyId: "",
    razorpayKeySecret: "",
  });
  const [saving, setSaving] = useState<Tab | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    const nextForm: FormState = {
      currency: settings?.currency || "INR",
      weightUnit: settings?.weightUnit || "kg",
      dimensionUnit: settings?.dimensionUnit || "cm",
      storeAddress: (settings?.storeAddress as StoreAddress) || {},
      guestCheckoutEnabled: settings?.guestCheckoutEnabled ?? true,
      termsRequired: settings?.termsRequired ?? false,
      orderNumberPrefix: settings?.orderNumberPrefix || "ORD-",
      codEnabled: settings?.codEnabled ?? true,
      razorpayEnabled: settings?.razorpayEnabled ?? true,
      razorpayKeyId: settings?.razorpayKeyId ?? "",
      // Never pre-fill the secret from server response — treated as write-only
      razorpayKeySecret: "",
    };

    setForm((prev) => {
      const same =
        prev.currency === nextForm.currency &&
        prev.weightUnit === nextForm.weightUnit &&
        prev.dimensionUnit === nextForm.dimensionUnit &&
        prev.guestCheckoutEnabled === nextForm.guestCheckoutEnabled &&
        prev.termsRequired === nextForm.termsRequired &&
        prev.orderNumberPrefix === nextForm.orderNumberPrefix &&
        prev.codEnabled === nextForm.codEnabled &&
        prev.razorpayEnabled === nextForm.razorpayEnabled &&
        prev.razorpayKeyId === nextForm.razorpayKeyId &&
        JSON.stringify(prev.storeAddress) ===
          JSON.stringify(nextForm.storeAddress);

      return same ? prev : nextForm;
    });
  }, [
    settings?.currency,
    settings?.weightUnit,
    settings?.dimensionUnit,
    settings?.storeAddress,
    settings?.guestCheckoutEnabled,
    settings?.termsRequired,
    settings?.orderNumberPrefix,
    settings?.codEnabled,
    settings?.razorpayEnabled,
    settings?.razorpayKeyId,
  ]);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }
  function updateAddress<K extends keyof StoreAddress>(
    k: K,
    v: StoreAddress[K],
  ) {
    setForm((prev) => ({
      ...prev,
      storeAddress: { ...prev.storeAddress, [k]: v },
    }));
  }

  async function save(which: Tab) {
    setSaving(which);
    try {
      const payload: any = {};
      if (which === "general") {
        payload.currency = form.currency;
        payload.weightUnit = form.weightUnit;
        payload.dimensionUnit = form.dimensionUnit;
        payload.storeAddress = form.storeAddress;
      } else if (which === "checkout") {
        payload.guestCheckoutEnabled = form.guestCheckoutEnabled;
        payload.termsRequired = form.termsRequired;
        payload.orderNumberPrefix = form.orderNumberPrefix;
      } else if (which === "payments") {
        payload.codEnabled = form.codEnabled;
        payload.razorpayEnabled = form.razorpayEnabled;
        payload.razorpayKeyId = form.razorpayKeyId || null;
        // Only send the secret if it was typed in (write-only field)
        if (form.razorpayKeySecret) {
          payload.razorpayKeySecret = form.razorpayKeySecret;
        }
      }
      await apiMutations.updateEcomSettings(payload);
      await mutate();
      // Clear the secret after save so it can't be re-sent accidentally
      if (which === "payments") update("razorpayKeySecret", "");
      toast({ title: "Settings saved" });
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading settings…
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "general", label: "General", icon: <Store className="h-4 w-4" /> },
    {
      key: "checkout",
      label: "Checkout",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      key: "payments",
      label: "Payments",
      icon: <CreditCard className="h-4 w-4" />,
    },
  ];

  return (
    <div
      className="max-w-4xl mx-auto py-8 px-4"
      data-testid="ecom-settings-page"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-primary/10">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">E-commerce settings</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Configure currency, checkout flow and payment methods.
      </p>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`ecom-settings-tab-${t.key}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "general" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Currency & units</CardTitle>
              <CardDescription className="text-xs">
                Used in prices, shipping, taxes and analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => update("currency", v)}
                  >
                    <SelectTrigger data-testid="ecom-currency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Weight unit</Label>
                  <Select
                    value={form.weightUnit}
                    onValueChange={(v) => update("weightUnit", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEIGHT_UNITS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Dimension unit</Label>
                  <Select
                    value={form.dimensionUnit}
                    onValueChange={(v) => update("dimensionUnit", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIMENSION_UNITS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Store address</CardTitle>
              <CardDescription className="text-xs">
                Origin address for shipping and taxes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Address line 1"
                value={form.storeAddress.line1 ?? ""}
                onChange={(e) => updateAddress("line1", e.target.value)}
              />
              <Input
                placeholder="Address line 2 (optional)"
                value={form.storeAddress.line2 ?? ""}
                onChange={(e) => updateAddress("line2", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="City"
                  value={form.storeAddress.city ?? ""}
                  onChange={(e) => updateAddress("city", e.target.value)}
                />
                <Input
                  placeholder="State / region"
                  value={form.storeAddress.state ?? ""}
                  onChange={(e) => updateAddress("state", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Postal code"
                  value={form.storeAddress.postalCode ?? ""}
                  onChange={(e) => updateAddress("postalCode", e.target.value)}
                />
                <Input
                  placeholder="Country (e.g. IN)"
                  value={form.storeAddress.country ?? ""}
                  onChange={(e) =>
                    updateAddress("country", e.target.value.toUpperCase())
                  }
                  className="uppercase font-mono"
                  maxLength={2}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => save("general")}
              disabled={saving === "general"}
              data-testid="ecom-settings-general-save"
            >
              {saving === "general" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save general
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {tab === "checkout" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Checkout options</CardTitle>
              <CardDescription className="text-xs">
                Control how customers place orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between rounded-md py-2 px-3 hover:bg-muted/50 cursor-pointer">
                <div>
                  <span className="block text-sm font-medium">
                    Allow guest checkout
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Customers can order without creating an account
                  </span>
                </div>
                <Switch
                  checked={form.guestCheckoutEnabled}
                  onCheckedChange={(v: boolean) =>
                    update("guestCheckoutEnabled", v)
                  }
                  data-testid="ecom-guest-checkout-toggle"
                />
              </label>
              <label className="flex items-center justify-between rounded-md py-2 px-3 hover:bg-muted/50 cursor-pointer">
                <div>
                  <span className="block text-sm font-medium">
                    Require terms acceptance
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Customers must accept T&amp;C before placing an order
                  </span>
                </div>
                <Switch
                  checked={form.termsRequired}
                  onCheckedChange={(v: boolean) => update("termsRequired", v)}
                  data-testid="ecom-terms-required-toggle"
                />
              </label>
              <div className="space-y-1.5 pt-2">
                <Label>Order number prefix</Label>
                <Input
                  value={form.orderNumberPrefix}
                  onChange={(e) => update("orderNumberPrefix", e.target.value)}
                  placeholder="ORD-"
                  className="font-mono"
                  data-testid="ecom-order-prefix-input"
                />
                <p className="text-xs text-muted-foreground">
                  Example order number:{" "}
                  <span className="font-mono">
                    {form.orderNumberPrefix}0001
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button
              onClick={() => save("checkout")}
              disabled={saving === "checkout"}
              data-testid="ecom-settings-checkout-save"
            >
              {saving === "checkout" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save checkout
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Cash on Delivery</CardTitle>
              <CardDescription className="text-xs">
                Enable COD as a payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex items-center justify-between rounded-md py-2 px-3 hover:bg-muted/50 cursor-pointer">
                <div>
                  <span className="block text-sm font-medium">COD enabled</span>
                  <span className="block text-xs text-muted-foreground">
                    Show &ldquo;Cash on Delivery&rdquo; at checkout
                  </span>
                </div>
                <Switch
                  checked={form.codEnabled}
                  onCheckedChange={(v: boolean) => update("codEnabled", v)}
                  data-testid="ecom-cod-toggle"
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Razorpay</CardTitle>
              <CardDescription className="text-xs">
                Card / UPI / netbanking payments via Razorpay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between rounded-md py-2 px-3 hover:bg-muted/50 cursor-pointer">
                <div>
                  <span className="block text-sm font-medium">
                    Razorpay enabled
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Turn on to accept online payments
                  </span>
                </div>
                <Switch
                  checked={form.razorpayEnabled}
                  onCheckedChange={(v: boolean) => update("razorpayEnabled", v)}
                  data-testid="ecom-razorpay-toggle"
                />
              </label>
              <div
                className={
                  form.razorpayEnabled
                    ? "space-y-3"
                    : "space-y-3 opacity-60 pointer-events-none"
                }
              >
                <div className="space-y-1.5">
                  <Label>Key ID</Label>
                  <Input
                    value={form.razorpayKeyId}
                    onChange={(e) => update("razorpayKeyId", e.target.value)}
                    placeholder="rzp_live_…"
                    className="font-mono"
                    data-testid="ecom-razorpay-keyid-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Key Secret</Label>
                  <div className="relative">
                    <Input
                      value={form.razorpayKeySecret}
                      type={showSecret ? "text" : "password"}
                      onChange={(e) =>
                        update("razorpayKeySecret", e.target.value)
                      }
                      placeholder={
                        settings.razorpayKeySecret
                          ? "Leave blank to keep existing"
                          : "Enter Razorpay secret"
                      }
                      className="font-mono pr-10"
                      data-testid="ecom-razorpay-secret-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((s) => !s)}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                      aria-label={showSecret ? "Hide" : "Show"}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The secret is write-only — the server never returns it.
                    Leave blank to keep the current value.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => save("payments")}
              disabled={saving === "payments"}
              data-testid="ecom-settings-payments-save"
            >
              {saving === "payments" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save payments
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EcommerceSettingsPage;
