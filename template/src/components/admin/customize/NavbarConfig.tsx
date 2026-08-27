"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchers } from "@/src/lib/fetchers";
import { Button } from "@/src/ui/button";
import SiteNavbar from "@/src/components/site/siteNavbar";
import { useCurrentUser } from "@/src/hooks/use-current-user";
import { apiMutations } from "@/src/lib/apimutation";
import { cn } from "@/src/lib/utils";
import { Label } from "@/src/ui/label";
import { Switch } from "@/src/ui/switch";
import { Input } from "@/src/ui/input";
import { Slider } from "@/src/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const DEFAULT_CONFIG = {
    bgColor: "#0B0F1A",
    bgOpacity: 90,
    linkColor: "#cbd5e1",
    linkHoverColor: "#ffffff",
    accentColor: "#22d3ee",
    dropdownBg: "#111827",
    sticky: true,
    blur: true,
    showLogin: true,
    showSignup: true,
    showPricing: true,
    loginLabel: "Log In",
    signupLabel: "Sign Up",
    pricingLabel: "Pricing",
    customCss: "",
};

// PLACEHOLDER — will correct once SiteFooter.tsx is shared
const DEFAULT_FOOTER_CONFIG = {
  bgColor: "#0B0F1A",
  textColor: "#94a3b8",
  linkColor: "#cbd5e1",
  linkHoverColor: "#ffffff",
  accentColor: "#22d3ee",
  borderColor: "#ffffff0d",
  customCss: "",
};

export default function NavbarConfigEditor() {
    const queryClient = useQueryClient();

    // ── navbar config ──
    const { data, isLoading } = useQuery({
        queryKey: ["navbar-config"],
        queryFn: fetchers.getNavbarConfig,
        staleTime: 0,
    });

    // ── real menus (same source SiteLayout/SiteNavbar actually use) ──
    const { data: menusData, isLoading: menusLoading } = useQuery({
        queryKey: ["menus"],
        queryFn: fetchers.menus,
        staleTime: 60_000,
    });

    // ── real site settings (for logo/siteName in preview) ──
    const { data: settingsData } = useQuery({
        queryKey: ["settings"],
        queryFn: fetchers.settings,
        staleTime: 60_000,
    });

    const headerMenu = useMemo(() => {
        const menus = menusData?.data ?? [];
        return menus.find((m: any) => m.location === "header") ?? null;
    }, [menusData]);

    const previewSettings = settingsData?.data ?? { siteName: "Your Site", logo: "" };

    const [draft, setDraft] = useState<any>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const config = useMemo(() => {
        if (draft) return draft;
        return data?.data ?? DEFAULT_CONFIG;
    }, [draft, data]);

    const update = (patch: Partial<typeof DEFAULT_CONFIG>) => {
        setDraft({ ...config, ...patch });
    };

    const { mutate: save, isPending: isSaving } = useMutation({
        mutationFn: (payload: any) => apiMutations.updateNavbarConfig(payload),
        onSuccess: (res) => {
            queryClient.setQueryData(["navbar-config"], res);
            setDraft(null);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        },
    });

    const { mutate: reset, isPending: isResetting } = useMutation({
        mutationFn: () => apiMutations.resetNavbarConfig(),
        onSuccess: (res) => {
            queryClient.setQueryData(["navbar-config"], res);
            setDraft(null);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        },
    });

    if (isLoading || menusLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-muted-foreground animate-pulse">Loading navbar settings…</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
            {/* ── LEFT: Controls ── */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold tracking-tight">Navbar Configuration</h2>
                    <div className="flex items-center gap-2">
                        {saveSuccess && (
                            <span className="flex items-center gap-1 text-sm text-success">
                                <CheckCircle2 className="h-4 w-4" />
                                Saved successfully
                            </span>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Colors</CardTitle>
                        <CardDescription>Customize the appearance of your navigation bar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4">
                            <ColorField label="Background" value={config.bgColor} onChange={(v) => update({ bgColor: v })} />
                            <RangeField label="Background Opacity" value={config.bgOpacity} onChange={(v) => update({ bgOpacity: v })} />
                            <ColorField label="Link Color" value={config.linkColor} onChange={(v) => update({ linkColor: v })} />
                            <ColorField label="Link Hover Color" value={config.linkHoverColor} onChange={(v) => update({ linkHoverColor: v })} />
                            <ColorField label="Accent (CTA buttons)" value={config.accentColor} onChange={(v) => update({ accentColor: v })} />
                            <ColorField label="Dropdown Background" value={config.dropdownBg} onChange={(v) => update({ dropdownBg: v })} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Behavior</CardTitle>
                        <CardDescription>Control how the navbar behaves on your site</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="sticky" className="text-sm text-muted-foreground">Sticky Header</Label>
                            <Switch
                                id="sticky"
                                checked={config.sticky}
                                onCheckedChange={(v) => update({ sticky: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="blur" className="text-sm text-muted-foreground">Background Blur</Label>
                            <Switch
                                id="blur"
                                checked={config.blur}
                                onCheckedChange={(v) => update({ blur: v })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Navigation Buttons</CardTitle>
                        <CardDescription>Configure which buttons appear in the navbar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ToggleWithLabel
                            label="Login Button"
                            checked={config.showLogin}
                            onCheckedChange={(v: boolean) => update({ showLogin: v })}
                            text={config.loginLabel}
                            onTextChange={(v: string) => update({ loginLabel: v })}
                        />
                        <ToggleWithLabel
                            label="Signup Button"
                            checked={config.showSignup}
                            onCheckedChange={(v: boolean) => update({ showSignup: v })}
                            text={config.signupLabel}
                            onTextChange={(v: string) => update({ signupLabel: v })}
                        />
                        <ToggleWithLabel
                            label="Pricing Button"
                            checked={config.showPricing}
                            onCheckedChange={(v: boolean) => update({ showPricing: v })}
                            text={config.pricingLabel}
                            onTextChange={(v: string) => update({ pricingLabel: v })}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Advanced CSS</CardTitle>
                        <CardDescription>Apply custom styles to the navbar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Custom CSS</Label>
                            <textarea
                                className="w-full h-40 font-mono text-sm rounded-md border border-input bg-background text-foreground p-3 resize-y focus:ring-2 focus:ring-ring focus:outline-none"
                                placeholder={`.your-class {\n  /* your CSS here */\n}`}
                                value={config.customCss}
                                onChange={(e) => update({ customCss: e.target.value })}
                                spellCheck={false}
                            />
                            <p className="text-xs text-muted-foreground">
                                Applies only within the navbar (#site-navbar). Use with care.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button 
                        onClick={() => save(config)} 
                        disabled={isSaving}
                        className="min-w-[120px]"
                    >
                        {isSaving ? "Saving…" : "Save Changes"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (confirm("Reset navbar to default settings? This can't be undone.")) reset();
                        }}
                        disabled={isResetting}
                    >
                        {isResetting ? "Resetting…" : "Reset to Default"}
                    </Button>
                    {draft && (
                        <span className="flex items-center gap-1 text-xs text-amber-500">
                            <AlertCircle className="h-3 w-3" />
                            Unsaved changes — preview only
                        </span>
                    )}
                </div>
            </div>

            {/* ── RIGHT: Live Preview ── */}
            <div className="lg:w-[400px] xl:w-[500px]">
                <div className="sticky top-6">
                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="text-base">Live Preview</CardTitle>
                            <CardDescription>See changes in real-time</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="bg-background relative rounded-b-lg overflow-hidden border-t">
                                <SiteNavbar settings={previewSettings} headerMenu={headerMenu} config={config} />
                                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm border-t border-border/50">
                                    Page content preview
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ── small field primitives ──

function ColorField({ label, value, onChange }: any) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-3">
                <div 
                    className="h-10 w-10 rounded-md border border-input overflow-hidden"
                    style={{ backgroundColor: value }}
                >
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-full w-full opacity-0 cursor-pointer"
                    />
                </div>
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 font-mono text-sm"
                />
            </div>
        </div>
    );
}

function RangeField({ label, value, onChange }: any) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">{label}</Label>
                <span className="text-sm font-mono text-muted-foreground">{value}%</span>
            </div>
            <Slider
                min={0}
                max={100}
                value={[value]}
                onValueChange={([v]) => onChange(v)}
                className="w-full"
            />
        </div>
    );
}

function ToggleWithLabel({ label, checked, onCheckedChange, text, onTextChange }: any) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">{label}</Label>
                <Switch
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                />
            </div>
            {checked && (
                <Input
                    type="text"
                    value={text}
                    onChange={(e) => onTextChange(e.target.value)}
                    className="w-full text-sm"
                    placeholder="Enter button label"
                />
            )}
        </div>
    );
}