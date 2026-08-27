// src/components/admin/ecommerce/ProductForm.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Save,
  ArrowLeft,
  X,
  Plus,
  ImageIcon,
  GripVertical,
  Package,
  DollarSign,
  Boxes,
  Settings2,
  Trash2,
  Star,
  Layers,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Textarea } from "@/src/ui/textarea";
import { Badge } from "@/src/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
import { Switch } from "@/src/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/ui/alert-dialog";
import { toast } from "@/src/hooks/use-toast";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "@/src/lib/apimutation";
import { SeoFieldsBlock, type SeoData } from "@/src/components/admin/seo/SeoFieldsBlock";

type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface ProductImage {
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface ProductFormValues {
  id?: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  inStock: boolean;
  status: ProductStatus;
  isFeatured: boolean;
  isVariable: boolean;
  seoData: SeoData;
  brandId: string | null;
  categoryIds: string[];
  images: ProductImage[];
}

interface BrandOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function makeEmpty(): ProductFormValues {
  return {
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    sku: "",
    price: 0,
    compareAtPrice: null,
    stockQuantity: 0,
    inStock: true,
    status: "DRAFT",
    isFeatured: false,
    isVariable: false,
    seoData: { metaTitle: "", metaDescription: "" },
    brandId: null,
    categoryIds: [],
    images: [],
  };
}

function normalizeFromApi(p: any): ProductFormValues {
  return {
    id: p?.id,
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    description: p?.description ?? "",
    shortDescription: p?.shortDescription ?? "",
    sku: p?.sku ?? "",
    price: Number(p?.price ?? 0),
    compareAtPrice:
      p?.compareAtPrice == null || p?.compareAtPrice === ""
        ? null
        : Number(p.compareAtPrice),
    stockQuantity: Number(p?.stockQuantity ?? 0),
    inStock: p?.inStock ?? true,
    status: (p?.status as ProductStatus) ?? "DRAFT",
    isFeatured: Boolean(p?.isFeatured),
    isVariable: Boolean(p?.isVariable),
    seoData:
      p?.seoData && typeof p.seoData === "object"
        ? { metaTitle: "", metaDescription: "", ...p.seoData }
        : { metaTitle: "", metaDescription: "" },
    brandId: p?.brand?.id ?? p?.brandId ?? null,
    categoryIds: Array.isArray(p?.categories)
      ? p.categories.map((c: any) => c.id)
      : Array.isArray(p?.categoryIds)
        ? p.categoryIds
        : [],
    images: Array.isArray(p?.images)
      ? p.images
          .slice()
          .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((img: any, idx: number) => ({
            url: img.url,
            altText: img.altText ?? "",
            sortOrder: img.sortOrder ?? idx,
          }))
      : [],
  };
}

export function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormValues>(makeEmpty());
  const [slugTouched, setSlugTouched] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing product for edit mode
  const { data: productResp, isLoading: loadingProduct } = useSWR(
    mode === "edit" && productId ? `ecommerce-product-${productId}` : null,
    () => fetchers.product(productId!),
  );

  useEffect(() => {
    if (mode === "edit" && productResp?.data) {
      const normalized = normalizeFromApi(productResp.data);
      setForm(normalized);
      setInitialSnapshot(JSON.stringify(normalized));
      setSlugTouched(true); // don't auto-mutate an existing slug
    } else if (mode === "create") {
      setInitialSnapshot(JSON.stringify(makeEmpty()));
    }
  }, [mode, productResp]);

  // Brands + Categories
  const { data: brandsResp } = useSWR("ecommerce-brands", () =>
    fetchers.brands(),
  );
  const { data: categoriesResp } = useSWR("ecommerce-categories", () =>
    fetchers.productCategories(),
  );
  const brands: BrandOption[] = useMemo(() => {
    const raw = brandsResp?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.brands)) return raw.brands;
    return [];
  }, [brandsResp]);

  const categories: CategoryOption[] = useMemo(() => {
    const raw = categoriesResp?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.categories)) return raw.categories;
    if (Array.isArray(raw.productCategories)) return raw.productCategories;
    return [];
  }, [categoriesResp]);

  // Unsaved-changes guard
  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return JSON.stringify(form) !== initialSnapshot;
  }, [form, initialSnapshot]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Field updater
  function update<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const { [key as string]: _, ...rest } = prev;
        return rest;
      });
    }
  }

  function handleTitleChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  }

  // Category selection
  function toggleCategory(id: string) {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  }

  // Images
  function addImage() {
    const url = newImageUrl.trim();
    if (!url) return;
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { url, altText: "", sortOrder: prev.images.length },
      ],
    }));
    setNewImageUrl("");
  }

  function removeImage(idx: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images
        .filter((_, i) => i !== idx)
        .map((img, i) => ({ ...img, sortOrder: i })),
    }));
  }

  function updateImageAlt(idx: number, alt: string) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === idx ? { ...img, altText: alt } : img,
      ),
    }));
  }

  // Drag-to-reorder (native HTML5 DnD, no extra deps)
  const dragIndex = useRef<number | null>(null);

  function onDragStart(idx: number) {
    dragIndex.current = idx;
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(idx: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from == null || from === idx) return;
    setForm((prev) => {
      const next = [...prev.images];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return {
        ...prev,
        images: next.map((img, i) => ({ ...img, sortOrder: i })),
      };
    });
  }

  // Validation
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.slug.trim()) errs.slug = "Slug is required";
    if (form.price < 0) errs.price = "Price cannot be negative";
    if (
      form.compareAtPrice != null &&
      form.compareAtPrice > 0 &&
      form.compareAtPrice <= form.price
    ) {
      errs.compareAtPrice = "Compare-at price must be greater than price";
    }
    if (form.stockQuantity < 0) errs.stockQuantity = "Stock cannot be negative";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validate()) {
      toast({
        title: "Fix the highlighted fields",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description,
        shortDescription: form.shortDescription,
        sku: form.sku.trim() || null,
        price: Number(form.price),
        compareAtPrice:
          form.compareAtPrice != null && form.compareAtPrice > 0
            ? Number(form.compareAtPrice)
            : null,
        stockQuantity: Number(form.stockQuantity),
        inStock: form.inStock,
        status: form.status,
        isFeatured: form.isFeatured,
        isVariable: form.isVariable,
        seoData: form.seoData,
        brandId: form.brandId || null,
        categoryIds: form.categoryIds,
        images: form.images.map((img, idx) => ({
          url: img.url,
          altText: img.altText || "",
          sortOrder: idx,
        })),
      };

      let saved;
      if (mode === "create") {
        saved = await apiMutations.createProduct(payload);
        toast({
          title: "Product created",
          description: `"${form.title}" was added.`,
        });
      } else {
        saved = await apiMutations.updateProduct(productId!, payload);
        toast({
          title: "Product updated",
          description: `"${form.title}" was saved.`,
        });
      }

      // Reset dirty snapshot after save
      setInitialSnapshot(JSON.stringify(form));

      if (mode === "create") {
        const newId = saved?.data?.id;
        if (newId) {
          router.push(`/admin/ecommerce/products/${newId}/edit`);
        } else {
          router.push("/admin/ecommerce/products");
        }
      }
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function attemptCancel() {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      router.push("/admin/ecommerce/products");
    }
  }

  // Loading state
  if (mode === "edit" && loadingProduct && !productResp) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading product…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" data-testid="product-form">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={attemptCancel}
            className="mb-2 gap-1.5 text-muted-foreground -ml-2"
            type="button"
            data-testid="product-back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to products
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              {mode === "create" ? "New product" : "Edit product"}
            </h1>
            {isDirty && (
              <Badge variant="outline" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={attemptCancel}
            data-testid="product-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            data-testid="product-save-btn"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === "create" ? "Create product" : "Save changes"}
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main column ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Product details</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Title, slug and descriptions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="p-title" className="text-sm font-medium">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="p-title"
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Wireless Bluetooth Headphones"
                    data-testid="product-title-input"
                    aria-invalid={!!errors.title}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-slug" className="text-sm font-medium">
                    Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="p-slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      update("slug", slugify(e.target.value));
                    }}
                    placeholder="wireless-bluetooth-headphones"
                    data-testid="product-slug-input"
                    aria-invalid={!!errors.slug}
                  />
                  <p className="text-xs text-muted-foreground">
                    /products/{form.slug || "your-product-slug"}
                  </p>
                  {errors.slug && (
                    <p className="text-xs text-destructive">{errors.slug}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-short" className="text-sm font-medium">
                    Short description
                  </Label>
                  <Textarea
                    id="p-short"
                    rows={2}
                    value={form.shortDescription}
                    onChange={(e) =>
                      update("shortDescription", e.target.value)
                    }
                    placeholder="One-line summary shown on product cards"
                    data-testid="product-short-desc-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-desc" className="text-sm font-medium">
                    Full description
                  </Label>
                  {/* NOTE: Plain textarea for now. Swap to a rich text editor
                      (e.g. shared PostEditor RTE) later without changing the
                      surrounding form contract. */}
                  <Textarea
                    id="p-desc"
                    rows={7}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Full product description shown on the product page…"
                    data-testid="product-desc-input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/10">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Pricing</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Set the selling price and optional compare-at price
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-price" className="text-sm font-medium">
                      Price (₹)
                    </Label>
                    <Input
                      id="p-price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.price}
                      onChange={(e) =>
                        update("price", Math.max(0, Number(e.target.value)))
                      }
                      data-testid="product-price-input"
                      aria-invalid={!!errors.price}
                    />
                    {errors.price && (
                      <p className="text-xs text-destructive">{errors.price}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="p-compare"
                      className="text-sm font-medium flex items-center gap-1"
                    >
                      Compare-at price
                      <span className="text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="p-compare"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.compareAtPrice ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        update(
                          "compareAtPrice",
                          v === "" ? null : Math.max(0, Number(v)),
                        );
                      }}
                      placeholder="Original price"
                      data-testid="product-compare-price-input"
                      aria-invalid={!!errors.compareAtPrice}
                    />
                    {errors.compareAtPrice && (
                      <p className="text-xs text-destructive">
                        {errors.compareAtPrice}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-500/10">
                    <Boxes className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Inventory</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      SKU and stock tracking
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-sku" className="text-sm font-medium">
                      SKU
                    </Label>
                    <Input
                      id="p-sku"
                      value={form.sku}
                      onChange={(e) => update("sku", e.target.value)}
                      placeholder="e.g. WBH-BLK-001"
                      className="font-mono"
                      data-testid="product-sku-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-stock" className="text-sm font-medium">
                      Stock quantity
                    </Label>
                    <Input
                      id="p-stock"
                      type="number"
                      min={0}
                      value={form.stockQuantity}
                      onChange={(e) =>
                        update(
                          "stockQuantity",
                          Math.max(0, Number(e.target.value)),
                        )
                      }
                      data-testid="product-stock-input"
                      aria-invalid={!!errors.stockQuantity}
                    />
                    {errors.stockQuantity && (
                      <p className="text-xs text-destructive">
                        {errors.stockQuantity}
                      </p>
                    )}
                  </div>
                </div>

                <label
                  className="flex items-center justify-between rounded-md hover:bg-muted/50 py-2.5 px-3 cursor-pointer transition-colors"
                  data-testid="product-instock-toggle"
                >
                  <div>
                    <span className="block text-sm font-medium">In stock</span>
                    <span className="block text-xs text-muted-foreground">
                      When off, product shows as sold out even if stock &gt; 0
                    </span>
                  </div>
                  <Switch
                    checked={form.inStock}
                    onCheckedChange={(v: boolean) => update("inStock", v)}
                  />
                </label>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-pink-500/10">
                    <ImageIcon className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Images</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      First image is used as the primary thumbnail. Drag to
                      reorder.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL — https://…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImage();
                      }
                    }}
                    data-testid="product-image-url-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addImage}
                    disabled={!newImageUrl.trim()}
                    data-testid="product-image-add-btn"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add
                  </Button>
                </div>

                {form.images.length === 0 ? (
                  <div className="border border-dashed rounded-lg py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-6 w-6 opacity-60" />
                    <p className="text-xs">
                      No images yet. Paste a URL above to add one.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {form.images.map((img, idx) => (
                      <div
                        key={`${img.url}-${idx}`}
                        draggable
                        onDragStart={() => onDragStart(idx)}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(idx)}
                        className="group relative rounded-lg border overflow-hidden bg-card"
                        data-testid={`product-image-${idx}`}
                      >
                        <div className="absolute top-2 left-2 z-10 rounded-md bg-background/80 backdrop-blur p-1 cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        {idx === 0 && (
                          <Badge className="absolute top-2 right-2 z-10 text-[10px] py-0 bg-primary text-primary-foreground hover:bg-primary">
                            Primary
                          </Badge>
                        )}
                        <div className="aspect-square bg-muted">
                          <img
                            src={img.url}
                            alt={img.altText || `Product image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 space-y-1.5">
                          <Input
                            value={img.altText || ""}
                            onChange={(e) => updateImageAlt(idx, e.target.value)}
                            placeholder="Alt text (accessibility)"
                            className="h-7 text-xs"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(idx)}
                            className="w-full text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            data-testid={`product-image-remove-${idx}`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO — reusable block */}
            <SeoFieldsBlock
              value={form.seoData}
              onChange={(next) => update("seoData", next)}
              entityLabel="product"
              previewPath={form.slug ? `products/${form.slug}` : "products"}
            />
          </div>

          {/* ── Sidebar column ──────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Status */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-500/10">
                      <Settings2 className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Status</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Visibility and product flags
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        update("status", v as ProductStatus)
                      }
                    >
                      <SelectTrigger data-testid="product-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <label className="flex items-center justify-between rounded-md py-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">Featured</span>
                    </div>
                    <Switch
                      checked={form.isFeatured}
                      onCheckedChange={(v: boolean) => update("isFeatured", v)}
                      data-testid="product-featured-toggle"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-md py-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">Variable product</span>
                    </div>
                    <Switch
                      checked={form.isVariable}
                      onCheckedChange={(v: boolean) => update("isVariable", v)}
                      data-testid="product-variable-toggle"
                    />
                  </label>
                </CardContent>
              </Card>

              {/* Organize */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-500/10">
                      <Layers className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Organize</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Brand and categories
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Brand</Label>
                    <Select
                      value={form.brandId ?? "__none"}
                      onValueChange={(v) =>
                        update("brandId", v === "__none" ? null : v)
                      }
                    >
                      <SelectTrigger data-testid="product-brand-select">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">No brand</SelectItem>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Categories</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between"
                          data-testid="product-categories-btn"
                        >
                          <span className="truncate text-sm font-normal text-left">
                            {form.categoryIds.length === 0
                              ? "Select categories"
                              : `${form.categoryIds.length} selected`}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-60 flex-shrink-0 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[260px] p-0" align="start">
                        <div className="max-h-64 overflow-auto p-1">
                          {categories.length === 0 && (
                            <p className="text-xs text-muted-foreground py-6 text-center">
                              No categories yet
                            </p>
                          )}
                          {categories.map((c) => {
                            const checked = form.categoryIds.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => toggleCategory(c.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted text-left"
                                data-testid={`product-category-option-${c.id}`}
                              >
                                <span
                                  className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                    checked
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-input"
                                  }`}
                                >
                                  {checked && (
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      className="h-3 w-3"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </span>
                                <span className="truncate">{c.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {form.categoryIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {form.categoryIds.map((id) => {
                          const cat = categories.find((c) => c.id === id);
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="text-xs gap-1 pl-2 pr-1 py-0.5"
                            >
                              {cat?.name ?? id}
                              <button
                                type="button"
                                onClick={() => toggleCategory(id)}
                                className="hover:bg-background/60 rounded p-0.5"
                                aria-label="Remove"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom save bar (mirror) */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={attemptCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === "create" ? "Create product" : "Save changes"}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Cancel confirm */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes on this product. Leaving now will lose
              them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push("/admin/ecommerce/products")}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProductForm;
