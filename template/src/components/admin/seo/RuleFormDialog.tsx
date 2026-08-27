import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/ui/dialog";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Button } from "@/src/ui/button";
import { Checkbox } from "@/src/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
import { RadioGroup, RadioGroupItem } from "@/src/ui/radio-group";

const DESTINATION_TYPES = [
  { value: "page", label: "Page" },
  { value: "post", label: "Post" },
  { value: "category", label: "Category" },
  { value: "tag", label: "Tag" },
//   { value: "course", label: "Course" },
  { value: "custom", label: "Custom URL" },
];

export interface RuleFormValue {
  id?: string;
  keyword: string;
  destinationType: string;
  destinationId?: string | null;
  destinationUrl: string;
  destinationLabel?: string;
  maxLinksPerPage: number;
  priority: number;
  enabled: boolean;
  wholeWordOnly: boolean;
  ignoreExistingLinks: boolean;
  ignoreHeadings: boolean;
  firstOccurrenceOnly: boolean;
  caseSensitive: boolean;
}

const DEFAULT_VALUE: RuleFormValue = {
  keyword: "",
  destinationType: "page",
  destinationId: null,
  destinationUrl: "",
  maxLinksPerPage: 1,
  priority: 0,
  enabled: true,
  wholeWordOnly: true,
  ignoreExistingLinks: true,
  ignoreHeadings: true,
  firstOccurrenceOnly: false,
  caseSensitive: false,
};

export function RuleFormDialog({
  open,
  onOpenChange,
  initialValue,
  onSubmit,
  submitting,
  pages = [],
    posts = [],
    tags = [],
    categories = [],
    
  // Pass in a searchable list of pages/posts/etc for the destination picker.
  // Shape: { id, label }[]. Fetch this at the page level and pass down.
}: {    
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: RuleFormValue | null;
  onSubmit: (value: RuleFormValue) => void;
  submitting?: boolean;
    pages?: { id: number | string; title: string; slug: string; status?: string }[];
  posts?: { id: number | string; title: string; slug: string; status?: string }[];
    categories?: { id: number | string; name: string; slug: string }[];
    tags?: { id: number | string; name: string; slug: string }[];
}) {
  const [value, setValue] = useState<RuleFormValue>(DEFAULT_VALUE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue ?? DEFAULT_VALUE);
      setError(null);
    }
  }, [open, initialValue]);

  const isEdit = Boolean(initialValue?.id);

  const destinationOptions = useMemo(() => {
  const source =
    value.destinationType === "page" ? pages :
    value.destinationType === "post" ? posts :
    value.destinationType === "category" ? categories :
    value.destinationType === "tag" ? tags :
    [];

  return source
    .filter((item: any) => !item.status || item.status === "PUBLISHED")
    .map((item: any) => ({
      id: String(item.id),
      label: `${item.title ?? item.name} (/${item.slug})`,
    }));
}, [value.destinationType, pages, posts, categories, tags]);

  function set<K extends keyof RuleFormValue>(key: K, val: RuleFormValue[K]) {
    setValue((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit() {
    if (!value.keyword.trim()) {
      setError("Keyword is required.");
      return;
    }
    if (value.destinationType === "custom" && !value.destinationUrl.trim()) {
      setError("Enter a destination URL.");
      return;
    }
    if (value.destinationType !== "custom" && !value.destinationId) {
      setError("Choose a destination.");
      return;
    }
    setError(null);
    onSubmit(value);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit link rule" : "Add link rule"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Basic info */}
          <div className="space-y-1.5">
            <Label htmlFor="keyword">Keyword *</Label>
            <Input
              id="keyword"
              placeholder="e.g. SEO Services"
              value={value.keyword}
              onChange={(e) => set("keyword", e.target.value)}
            />
          </div>

          {/* Destination type */}
          <div className="space-y-2">
            <Label>Destination type</Label>
            <RadioGroup
              value={value.destinationType}
              onValueChange={(v) =>
                setValue((prev) => ({
                  ...prev,
                  destinationType: v,
                  destinationId: null,
                  destinationUrl: "",
                }))
              }
              className="grid grid-cols-2 gap-2"
            >
              {DESTINATION_TYPES.map((t) => (
                <div key={t.value} className="flex items-center gap-2">
                  <RadioGroupItem value={t.value} id={`dt-${t.value}`} />
                  <Label htmlFor={`dt-${t.value}`} className="font-normal cursor-pointer">
                    {t.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Destination picker */}
          <div className="space-y-1.5">
            <Label>Destination</Label>
            {value.destinationType === "custom" ? (
              <Input
                placeholder="https://example.com or /path"
                value={value.destinationUrl}
                onChange={(e) => set("destinationUrl", e.target.value)}
              />
            ) : (
              <Select
                value={value.destinationId ?? ""}
                onValueChange={(v) => set("destinationId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Search ${value.destinationType}...`} />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No options found
                    </div>
                  ) : (
                    destinationOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Behaviour */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="maxLinks">Max links per page</Label>
              <Input
                id="maxLinks"
                type="number"
                min={1}
                value={value.maxLinksPerPage}
                onChange={(e) => set("maxLinksPerPage", Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={value.priority}
                onChange={(e) => set("priority", Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            <Label>Options</Label>
            {[
              ["enabled", "Enabled"],
              ["wholeWordOnly", "Whole word only"],
              ["ignoreExistingLinks", "Ignore existing links"],
              ["ignoreHeadings", "Ignore headings"],
              ["firstOccurrenceOnly", "First occurrence only"],
              ["caseSensitive", "Case sensitive"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={key}
                  checked={value[key as keyof RuleFormValue] as boolean}
                  onCheckedChange={(checked) => set(key as keyof RuleFormValue, Boolean(checked) as any)}
                />
                <Label htmlFor={key} className="font-normal cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}