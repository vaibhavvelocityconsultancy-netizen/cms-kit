"use client";

import { useEffect, useState } from "react";
// import {
//   useBreadcrumbSettings,
//   useUpdateBreadcrumbSettings,
// } from "@/hooks/useBreadcrumbSettings"; // adjust path to match your project

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/ui/card";
import { Label } from "@/src/ui/label";
import { Input } from "@/src/ui/input";
import { Switch } from "@/src/ui/switch";
import { Separator } from "@/src/ui/separator";
import { Button } from "@/src/ui/button";
import { Textarea } from "@/src/ui/textarea";
import { Loader2, Save } from "lucide-react";
import {
  useBreadcrumbSettings,
  useUpdateBreadcrumbSettings,
} from "@/src/hooks/use-breadcramp";
import { toast } from "@/src/hooks/use-toast";

type BreadcrumbFormState = {
  enabled: boolean;
  homeLabel: string;
  separator: string;

  showHome: boolean;
  showCurrent: boolean;
  showParent: boolean;

  pagesEnabled: boolean;
  postsEnabled: boolean;
  categoriesEnabled: boolean;
  tagsEnabled: boolean;
  coursesEnabled: boolean;

  hideOnHome: boolean;
  hideOn404: boolean;
  hideOnSearch: boolean;

  schemaEnabled: boolean;

  cssClass: string;
  customCss: string;
  linkColor: string;
  linkHoverColor: string;
  currentColor: string;
  separatorColor: string;
};

const DEFAULT_STATE: BreadcrumbFormState = {
  enabled: true,
  homeLabel: "Home",
  separator: "/",
  showHome: true,
  showCurrent: true,
  showParent: true,
  pagesEnabled: true,
  postsEnabled: true,
  categoriesEnabled: true,
  tagsEnabled: true,
  coursesEnabled: true,
  hideOnHome: true,
  hideOn404: true,
  hideOnSearch: false,
  schemaEnabled: true,
  cssClass: "",
  customCss: "",
  linkColor: "#4b5563",
  linkHoverColor: "#111827",
  currentColor: "#6b7280",
  separatorColor: "#9ca3af",
};

export default function BreadcrumbSettingsPage() {
  const { data, isLoading } = useBreadcrumbSettings();
  const { mutate: updateSettings, isPending } = useUpdateBreadcrumbSettings();

  const [form, setForm] = useState<BreadcrumbFormState>(DEFAULT_STATE);
  const [isDirty, setIsDirty] = useState(false);

  // Sync server data into local draft state once loaded
  useEffect(() => {
    if (data) {
      setForm({
        enabled: data.enabled ?? true,
        homeLabel: data.homeLabel ?? "Home",
        separator: data.separator ?? "/",
        showHome: data.showHome ?? true,
        showCurrent: data.showCurrent ?? true,
        showParent: data.showParent ?? true,
        pagesEnabled: data.pagesEnabled ?? true,
        postsEnabled: data.postsEnabled ?? true,
        categoriesEnabled: data.categoriesEnabled ?? true,
        tagsEnabled: data.tagsEnabled ?? true,
        coursesEnabled: data.coursesEnabled ?? true,
        hideOnHome: data.hideOnHome ?? true,
        hideOn404: data.hideOn404 ?? true,
        hideOnSearch: data.hideOnSearch ?? false,
        schemaEnabled: data.schemaEnabled ?? true,
        cssClass: data.cssClass ?? "",
        customCss: data.customCss ?? "",
        linkColor: data.linkColor ?? "#4b5563",
        linkHoverColor: data.linkHoverColor ?? "#111827",
        currentColor: data.currentColor ?? "#6b7280",
        separatorColor: data.separatorColor ?? "#9ca3af",
      });
      setIsDirty(false);
    }
  }, [data]);

  const update = <K extends keyof BreadcrumbFormState>(
    key: K,
    value: BreadcrumbFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateSettings(form, {
      onSuccess: () => {
        toast({
          title: "Breadcrumb settings saved",
        });
        setIsDirty(false);
      },
      onError: () => {
        toast({
          title: "Failed to save breadcrumb settings",
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Breadcrumb Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Control how breadcrumb navigation appears across your site.
          </p>
        </div>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Master toggle and basic labels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable breadcrumbs</Label>
              <p className="text-sm text-muted-foreground">
                Turn breadcrumb navigation on or off site-wide.
              </p>
            </div>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => update("enabled", v)}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="homeLabel">Home label</Label>
              <Input
                id="homeLabel"
                value={form.homeLabel}
                onChange={(e) => update("homeLabel", e.target.value)}
                placeholder="Home"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="separator">Separator</Label>
              <Input
                id="separator"
                value={form.separator}
                onChange={(e) => update("separator", e.target.value)}
                placeholder="/"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>
            Choose which breadcrumb segments to show.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Show home"
            checked={form.showHome}
            onCheckedChange={(v) => update("showHome", v)}
          />
          <ToggleRow
            label="Show parent pages"
            checked={form.showParent}
            onCheckedChange={(v) => update("showParent", v)}
          />
          <ToggleRow
            label="Show current page"
            checked={form.showCurrent}
            onCheckedChange={(v) => update("showCurrent", v)}
          />
        </CardContent>
      </Card>

      {/* Content types */}
      <Card>
        <CardHeader>
          <CardTitle>Content Types</CardTitle>
          <CardDescription>
            Enable breadcrumbs per content type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Pages"
            checked={form.pagesEnabled}
            onCheckedChange={(v) => update("pagesEnabled", v)}
          />
          <ToggleRow
            label="Posts"
            checked={form.postsEnabled}
            onCheckedChange={(v) => update("postsEnabled", v)}
          />
          <ToggleRow
            label="Categories"
            checked={form.categoriesEnabled}
            onCheckedChange={(v) => update("categoriesEnabled", v)}
          />
          <ToggleRow
            label="Tags"
            checked={form.tagsEnabled}
            onCheckedChange={(v) => update("tagsEnabled", v)}
          />
          <ToggleRow
            label="Courses"
            checked={form.coursesEnabled}
            onCheckedChange={(v) => update("coursesEnabled", v)}
          />
        </CardContent>
      </Card>

      {/* Hide on */}
      <Card>
        <CardHeader>
          <CardTitle>Hide On</CardTitle>
          <CardDescription>
            Suppress breadcrumbs on specific page types.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Home page"
            checked={form.hideOnHome}
            onCheckedChange={(v) => update("hideOnHome", v)}
          />
          <ToggleRow
            label="404 page"
            checked={form.hideOn404}
            onCheckedChange={(v) => update("hideOn404", v)}
          />
          <ToggleRow
            label="Search results"
            checked={form.hideOnSearch}
            onCheckedChange={(v) => update("hideOnSearch", v)}
          />
        </CardContent>
      </Card>

      {/* SEO / Schema */}
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>Structured data for search engines.</CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleRow
            label="Enable BreadcrumbList schema"
            checked={form.schemaEnabled}
            onCheckedChange={(v) => update("schemaEnabled", v)}
          />
        </CardContent>
      </Card>

      {/* Styling */}
      <Card>
        <CardHeader>
          <CardTitle>Styling</CardTitle>
          <CardDescription>Custom CSS class and overrides.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cssClass">CSS class</Label>
            <Input
              id="cssClass"
              value={form.cssClass}
              onChange={(e) => update("cssClass", e.target.value)}
              placeholder="e.g. my-breadcrumbs (without a dot)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customCss">Custom CSS</Label>
            <Textarea
              id="customCss"
              value={form.customCss}
              onChange={(e) => update("customCss", e.target.value)}
              rows={6}
              className="font-mono text-sm"
              placeholder=".breadcrumbs { color: white; font-size: 14px; }"
            />
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
          <CardDescription>
            Customize breadcrumb link and text colors.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <ColorField
            label="Link color"
            value={form.linkColor}
            onChange={(v) => update("linkColor", v)}
          />
          <ColorField
            label="Link hover color"
            value={form.linkHoverColor}
            onChange={(v) => update("linkHoverColor", v)}
          />
          <ColorField
            label="Current breadcrumb color"
            value={form.currentColor}
            onChange={(v) => update("currentColor", v)}
          />
          <ColorField
            label="Separator color"
            value={form.separatorColor}
            onChange={(v) => update("separatorColor", v)}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={!isDirty || isPending}>
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save changes
      </Button>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded border cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
