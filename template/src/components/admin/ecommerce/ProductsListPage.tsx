// src/components/admin/ecommerce/ProductsListPage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ImageOff,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Badge } from "@/src/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/ui/table";
import { toast } from "@/src/hooks/use-toast";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "@/src/lib/apimutation";

type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface ProductRow {
  id: string;
  title: string;
  slug: string;
  sku?: string | null;
  price: number | string;
  compareAtPrice?: number | string | null;
  stockQuantity: number;
  inStock: boolean;
  status: ProductStatus;
  isFeatured: boolean;
  images?: { id?: string; url: string; altText?: string | null }[];
  brand?: { id: string; name: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BrandOption {
  id: string;
  name: string;
}

const PAGE_SIZE = 10;

function formatINR(val: number | string | null | undefined) {
  const n = Number(val ?? 0);
  if (!isFinite(n) || n === 0) return "₹0";
  return "₹" + n.toLocaleString("en-IN");
}

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<
    ProductStatus,
    { className: string; label: string }
  > = {
    PUBLISHED: {
      className:
        "bg-green-500/15 text-green-700 border-green-200 hover:bg-green-500/20",
      label: "Published",
    },
    DRAFT: {
      className: "bg-amber-500/15 text-amber-700 border-amber-200",
      label: "Draft",
    },
    ARCHIVED: {
      className: "bg-muted text-muted-foreground",
      label: "Archived",
    },
  };
  const cfg = map[status] ?? map.DRAFT;
  return (
    <Badge className={`text-xs py-0 ${cfg.className}`} variant="outline">
      {cfg.label}
    </Badge>
  );
}

function ProductRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 rounded bg-muted animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function ProductsListPage() {
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [brandFilter, setBrandFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, brandFilter]);

  // Brands
  const { data: brandsResp } = useSWR("ecommerce-brands", () =>
    fetchers.brands(),
  );
  const brands: BrandOption[] = useMemo(() => {
    const raw = brandsResp?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.brands)) return raw.brands;
    return [];
  }, [brandsResp]);

  // Products
  const productsKey = [
    "ecommerce-products",
    debouncedSearch,
    statusFilter,
    brandFilter,
    page,
  ].join("|");

  const { data, error, isLoading, mutate } = useSWR(productsKey, () =>
    fetchers.products({
      search: debouncedSearch || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      brandId: brandFilter === "ALL" ? undefined : brandFilter,
      page,
      limit: PAGE_SIZE,
    }),
  );

  const products: ProductRow[] = data?.data?.products ?? [];
  const pagination: Pagination = data?.data?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiMutations.deleteProduct(deleteTarget.id);
      toast({
        title: "Product deleted",
        description: `"${deleteTarget.title}" was removed.`,
      });
      setDeleteTarget(null);
      await mutate();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Could not delete product",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  const activeFilterCount =
    (debouncedSearch ? 1 : 0) +
    (statusFilter !== "ALL" ? 1 : 0) +
    (brandFilter !== "ALL" ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" data-testid="products-list-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Products</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your storefront catalog — inventory, pricing and status.
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/ecommerce/products/new")}
          data-testid="add-product-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add product
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title or SKU…"
            className="pl-8"
            data-testid="products-search-input"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-[160px]" data-testid="products-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="sm:w-[180px]" data-testid="products-brand-filter">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px]">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[140px]">SKU</TableHead>
              <TableHead className="w-[110px] text-right">Price</TableHead>
              <TableHead className="w-[90px] text-right">Stock</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[140px]">Brand</TableHead>
              <TableHead className="w-[110px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <ProductRowSkeleton key={i} />
              ))}

            {!isLoading && error && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-destructive">
                    <AlertCircle className="h-6 w-6" />
                    <p className="text-sm font-medium">Failed to load products</p>
                    <p className="text-xs text-muted-foreground">
                      {(error as Error)?.message ?? "Try refreshing the page."}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => mutate()}
                    >
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div
                    className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground"
                    data-testid="products-empty-state"
                  >
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 opacity-60" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {activeFilterCount > 0
                          ? "No products match your filters"
                          : "No products yet"}
                      </p>
                      <p className="text-xs mt-1">
                        {activeFilterCount > 0
                          ? "Try adjusting or clearing your filters."
                          : "Add your first product to get started."}
                      </p>
                    </div>
                    {activeFilterCount === 0 && (
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push("/admin/ecommerce/products/new")
                        }
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add product
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !error &&
              products.map((p) => {
                const primaryImage = p.images?.[0]?.url;
                return (
                  <TableRow
                    key={p.id}
                    data-testid={`product-row-${p.id}`}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell>
                      <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={p.images?.[0]?.altText || p.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          router.push(
                            `/admin/ecommerce/products/${p.id}/edit`,
                          )
                        }
                        className="font-medium text-sm hover:underline text-left"
                      >
                        {p.title}
                      </button>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        {p.isFeatured && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5"
                          >
                            Featured
                          </Badge>
                        )}
                        {!p.inStock && (
                          <span className="text-destructive">Out of stock</span>
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {p.sku || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm font-medium">
                        {formatINR(p.price)}
                      </div>
                      {p.compareAtPrice &&
                        Number(p.compareAtPrice) > Number(p.price) && (
                          <div className="text-xs text-muted-foreground line-through">
                            {formatINR(p.compareAtPrice)}
                          </div>
                        )}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {p.stockQuantity}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[140px]">
                      {p.brand?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/admin/ecommerce/products/${p.id}/edit`,
                            )
                          }
                          data-testid={`product-edit-btn-${p.id}`}
                          className="h-8 w-8 p-0"
                          title="Edit product"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(p)}
                          data-testid={`product-delete-btn-${p.id}`}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && !error && pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {pagination.total}
            </span>{" "}
            product{pagination.total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-xs text-muted-foreground tabular-nums">
              Page {pagination.page} / {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages || 1, p + 1))
              }
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage(pagination.totalPages || 1)}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-testid="product-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to permanently delete{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deleteTarget?.title}&rdquo;
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
              data-testid="product-delete-confirm-btn"
            >
              {deleting ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProductsListPage;
