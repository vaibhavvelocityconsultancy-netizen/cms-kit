// src/components/admin/ecommerce/_shared/EcomListShell.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/ui/table";

/**
 * Reusable list-page shell for every e-commerce module (Categories,
 * Brands, Attributes, Discounts, Orders…). Provides header, search bar,
 * filter slot, table body slot, loading/empty/error/pagination in one
 * component so each module page stays ~60 lines.
 */

export interface EcomListShellProps<T> {
  title: string;
  description?: string;
  icon: React.ReactNode;
  addButtonLabel?: string;
  onAddClick?: () => void;

  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;

  filters?: React.ReactNode;
  bulkBar?: React.ReactNode;

  columns: { key: string; label: string; className?: string }[];
  rows: T[];
  renderRow: (row: T) => React.ReactNode;

  isLoading?: boolean;
  error?: any;
  emptyTitle?: string;
  emptyDescription?: string;
  activeFilterCount?: number;

  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
  onPageChange?: (page: number) => void;

  onRetry?: () => void;
  testId?: string;
}

export function EcomListShell<T>(props: EcomListShellProps<T>) {
  const {
    title,
    description,
    icon,
    addButtonLabel,
    onAddClick,
    searchValue,
    onSearchChange,
    searchPlaceholder = "Search…",
    filters,
    bulkBar,
    columns,
    rows,
    renderRow,
    isLoading,
    error,
    emptyTitle = "Nothing here yet",
    emptyDescription = "Add your first item to get started.",
    activeFilterCount = 0,
    page = 1,
    totalPages = 1,
    total,
    limit = 10,
    onPageChange,
    onRetry,
    testId,
  } = props;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" data-testid={testId}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-primary/10">{icon}</div>
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {addButtonLabel && onAddClick && (
          <Button onClick={onAddClick} data-testid={`${testId}-add-btn`}>
            <Plus className="h-4 w-4 mr-2" />
            {addButtonLabel}
          </Button>
        )}
      </div>

      {/* Toolbar */}
      {(onSearchChange || filters) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {onSearchChange && (
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
                data-testid={`${testId}-search`}
              />
            </div>
          )}
          {filters}
        </div>
      )}

      {bulkBar}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>
                      <div className="h-4 rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && error && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-destructive">
                    <AlertCircle className="h-6 w-6" />
                    <p className="text-sm font-medium">Failed to load</p>
                    <p className="text-xs text-muted-foreground">
                      {(error as Error)?.message ??
                        "Try refreshing the page."}
                    </p>
                    {onRetry && (
                      <Button size="sm" variant="outline" onClick={onRetry}>
                        Retry
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div
                    className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground"
                    data-testid={`${testId}-empty`}
                  >
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {activeFilterCount > 0
                          ? "No results match your filters"
                          : emptyTitle}
                      </p>
                      <p className="text-xs mt-1">
                        {activeFilterCount > 0
                          ? "Try adjusting or clearing your filters."
                          : emptyDescription}
                      </p>
                    </div>
                    {activeFilterCount === 0 &&
                      addButtonLabel &&
                      onAddClick && (
                        <Button size="sm" onClick={onAddClick}>
                          <Plus className="h-4 w-4 mr-1.5" />
                          {addButtonLabel}
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && rows.map((row) => renderRow(row))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && !error && (total ?? 0) > 0 && onPageChange && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(page - 1) * limit + 1}–{Math.min(page * limit, total ?? 0)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{total}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-xs text-muted-foreground tabular-nums">
              Page {page} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= (totalPages || 1)}
              onClick={() => onPageChange(Math.min(totalPages || 1, page + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= (totalPages || 1)}
              onClick={() => onPageChange(totalPages || 1)}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
