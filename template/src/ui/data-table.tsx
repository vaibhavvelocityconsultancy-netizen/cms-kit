import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ListFilter,
  Columns3,
  X,
} from "lucide-react";
import { Input } from "@/src/ui/input";
import { Button } from "@/src/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/ui/popover";
import { Checkbox } from "@/src/ui/checkbox";
import { ScrollArea } from "@/src/ui/scroll-area";
import { cn } from "@/src/lib/utils";
import { Badge } from "@/src/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  filterable?: boolean;
  className?: string;
  filterValue?: (row: T) => string;
  /** Set to false to always show this column and hide it from the column picker. Defaults to true. */
  hideable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  getRowClassName?: (row: T) => string;
  toolbarActions?: React.ReactNode;
  enableRowSelection?: boolean;
  selectedRows?: T[];
  onSelectedRowsChange?: (rows: T[]) => void;
  getRowId?: (row: T) => string | number;
  /** Enables the "Columns" dropdown so users can show/hide columns. Default false. */
  enableColumnVisibility?: boolean;
  /** Keys of columns hidden by default (only applies when no saved state exists). */
  defaultHiddenColumns?: string[];
  /** Unique key used to persist column visibility in localStorage. If omitted, visibility resets on remount. */
  persistKey?: string;
  /** Optional callback fired whenever column visibility changes. */
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
}

// --- Active Filters Bar Component ---
function ActiveFiltersBar<T>({
  columns,
  columnFilters,
  onFilterChange,
}: {
  columns: Column<T>[];
  columnFilters: Record<string, Set<string>>;
  onFilterChange: (key: string, values: Set<string>) => void;
}) {
  const activeFilters = Object.entries(columnFilters);

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className="text-xs text-muted-foreground">Active filters:</span>
      {activeFilters.map(([key, values]) => {
        const column = columns.find((c) => c.key === key);
        const valueCount = values.size;
        return (
          <Badge
            key={key}
            variant="secondary"
            className="gap-1.5 pl-2 pr-1.5 py-1 text-xs"
          >
            <span className="font-medium">{column?.header}:</span>
            <span>
              {valueCount} value{valueCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => onFilterChange(key, new Set())}
              className="ml-1 rounded-full hover:bg-muted p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
      <button
        onClick={() => {
          Object.keys(columnFilters).forEach((key) => {
            onFilterChange(key, new Set());
          });
        }}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}

// --- Column Filter Dropdown Component ---
function ColumnFilterDropdown<T>({
  columnKey,
  columns,
  data,
  activeFilters,
  onFilterChange,
}: {
  columnKey: string;
  columns: Column<T>[];
  data: T[];
  activeFilters: Set<string>;
  onFilterChange: (key: string, values: Set<string>) => void;
}) {
  const [filterSearch, setFilterSearch] = useState("");
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const uniqueValues = useMemo(() => {
    const values = new Set<string>();
    const column = columns.find((c) => c.key === columnKey);
    data.forEach((row) => {
      const val = column?.filterValue
        ? column.filterValue(row)
        : (row as any)[columnKey];
      if (val != null && val !== "") values.add(String(val));
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [data, columnKey, columns]);

  const filteredValues = useMemo(() => {
    if (!filterSearch.trim()) return uniqueValues;
    const q = filterSearch.toLowerCase();
    return uniqueValues.filter((v) => v.toLowerCase().includes(q));
  }, [uniqueValues, filterSearch]);

  useEffect(() => {
    if (open) {
      setLocalSelected(new Set(activeFilters));
      setFilterSearch("");
    }
  }, [open, activeFilters]);

  const isAllSelected = localSelected.size === uniqueValues.length;
  const hasActiveFilter = activeFilters.size > 0;

  const toggleValue = (val: string) => {
    setLocalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setLocalSelected(new Set());
    } else {
      setLocalSelected(new Set(uniqueValues));
    }
  };

  const handleApply = () => {
    if (localSelected.size === 0) {
      onFilterChange(columnKey, new Set());
    } else {
      onFilterChange(columnKey, new Set(localSelected));
    }
    setOpen(false);
  };

  const handleClear = () => {
    onFilterChange(columnKey, new Set());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center rounded-md p-1 transition-all duration-200",
            "hover:bg-accent hover:scale-105",
            hasActiveFilter && "bg-primary/10 text-primary",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <ListFilter
            className={cn(
              "h-3.5 w-3.5 sm:h-4 sm:w-4",
              hasActiveFilter ? "text-primary" : "text-muted-foreground/60",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 shadow-lg"
        align="start"
        sideOffset={5}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search values..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="h-8 pl-8 text-sm bg-background"
            />
          </div>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2.5 border-b cursor-pointer hover:bg-muted/50 transition-colors text-sm"
          onClick={toggleAll}
        >
          <Checkbox checked={isAllSelected} className="h-4 w-4" />
          <span className="font-medium">Select All</span>
          <span className="text-xs text-muted-foreground ml-auto">
            ({uniqueValues.length})
          </span>
        </div>

        <ScrollArea className="max-h-64">
          {filteredValues.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No matching values
            </div>
          ) : (
            <div className="py-1">
              {filteredValues.map((val) => (
                <div
                  key={val}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors text-sm group"
                  onClick={() => toggleValue(val)}
                >
                  <Checkbox
                    checked={localSelected.has(val)}
                    className="h-4 w-4"
                  />
                  <span className="truncate flex-1">{val}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center gap-2 p-3 border-t bg-muted/30">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-8 text-sm"
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-sm"
            onClick={handleApply}
          >
            Apply Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Column Visibility Dropdown Component ---
function ColumnVisibilityDropdown<T>({
  columns,
  visibility,
  onToggle,
  onShowAll,
  onHideAll,
}: {
  columns: Column<T>[];
  visibility: Record<string, boolean>;
  onToggle: (key: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}) {
  const toggleableColumns = useMemo(
    () => columns.filter((c) => c.hideable !== false),
    [columns],
  );

  if (toggleableColumns.length === 0) return null;

  const visibleCount = toggleableColumns.filter(
    (c) => visibility[c.key] !== false,
  ).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 text-sm">
          <Columns3 className="h-3.5 w-3.5" />
          Columns
          <Badge variant="secondary" className="ml-1 px-1.5 text-xs">
            {visibleCount}/{toggleableColumns.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-0 bg-popover border shadow-lg rounded-md overflow-hidden z-50"
        align="start"
        sideOffset={5}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground">
            Toggle columns
          </span>
          <div className="flex gap-2">
            <button
              onClick={onShowAll}
              className="text-xs text-primary hover:underline"
            >
              Show all
            </button>
            <button
              onClick={onHideAll}
              className="text-xs text-muted-foreground hover:underline"
            >
              Hide all
            </button>
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto bg-popover">
          <div className="py-1 bg-popover">
            {toggleableColumns.map((col) => {
              const isVisible = visibility[col.key] !== false;
              return (
                <div
                  key={col.key}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors text-sm"
                  onClick={() => onToggle(col.key)}
                >
                  <Checkbox checked={isVisible} className="h-4 w-4" />
                  <span className="truncate flex-1">{col.header}</span>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Main DataTable Component ---
export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKeys = [],
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  emptyMessage = "No data found.",
  getRowClassName,
  toolbarActions,
  enableRowSelection = false,
  selectedRows: externalSelectedRows,
  onSelectedRowsChange,
  getRowId = (row) => (row.id ?? JSON.stringify(row)) as string | number,
  enableColumnVisibility = false,
  defaultHiddenColumns = [],
  persistKey,
  onColumnVisibilityChange,
}: DataTableProps<T>) {
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const storageKey = persistKey ? `datatable-columns:${persistKey}` : null;

  // Column visibility state: key -> visible. Missing key defaults to visible.
  // Loads from localStorage on first render if persistKey is provided.
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore parse/storage errors, fall back to default below
      }
    }
    const initial: Record<string, boolean> = {};
    defaultHiddenColumns.forEach((key) => {
      initial[key] = false;
    });
    return initial;
  });

  const updateColumnVisibility = (
    updater: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => {
    setColumnVisibility((prev) => {
      const next = updater(prev);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // storage full or unavailable, skip silently
        }
      }
      onColumnVisibilityChange?.(next);
      return next;
    });
  };

  const toggleColumnVisibility = (key: string) => {
    updateColumnVisibility((prev) => ({
      ...prev,
      [key]: prev[key] === false ? true : false,
    }));
  };

  const showAllColumns = () => {
    updateColumnVisibility(() => ({}));
  };

  const hideAllColumns = () => {
    updateColumnVisibility(() => {
      const next: Record<string, boolean> = {};
      columns.forEach((c) => {
        if (c.hideable !== false) next[c.key] = false;
      });
      return next;
    });
  };

  // Internal selection state if external not provided
  const [internalSelectedRows, setInternalSelectedRows] = useState<
    Set<string | number>
  >(new Set());

  // Use external state if provided, otherwise use internal
  const selectedRowIds =
    externalSelectedRows !== undefined
      ? new Set(externalSelectedRows.map((row) => getRowId(row)))
      : internalSelectedRows;

  const setSelectedRowIds = (ids: Set<string | number>) => {
    if (onSelectedRowsChange) {
      const selectedRowsArray = safeData.filter((row) =>
        ids.has(getRowId(row)),
      );
      onSelectedRowsChange(selectedRowsArray);
    } else {
      setInternalSelectedRows(ids);
    }
  };


  const searchFilteredData = useMemo(() => {
    if (!searchQuery.trim() || searchKeys.length === 0) return safeData;
    const query = searchQuery.toLowerCase();
    return safeData.filter((row) =>
      searchKeys.some((key) => {
        const value = row[key];
        if (typeof value === "string")
          return value.toLowerCase().includes(query);
        if (typeof value === "number") return value.toString().includes(query);
        return false;
      }),
    );
  }, [safeData, searchQuery, searchKeys]);


  const filteredData = searchFilteredData; // ✅ no more column filters, just search
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Row selection handlers
  const isRowSelected = (row: T) => {
    return selectedRowIds.has(getRowId(row));
  };

  const toggleRowSelection = (row: T) => {
    const rowId = getRowId(row);
    const newSelection = new Set(selectedRowIds);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRowIds(newSelection);
  };

  const toggleAllRowsOnPage = () => {
    const allPageSelected = paginatedData.every((row) =>
      selectedRowIds.has(getRowId(row)),
    );
    const newSelection = new Set(selectedRowIds);

    if (allPageSelected) {
      paginatedData.forEach((row) => {
        newSelection.delete(getRowId(row));
      });
    } else {
      paginatedData.forEach((row) => {
        newSelection.add(getRowId(row));
      });
    }
    setSelectedRowIds(newSelection);
  };

  const toggleAllRowsAcrossPages = () => {
    const allRowsSelected = filteredData.every((row) =>
      selectedRowIds.has(getRowId(row)),
    );
    if (allRowsSelected) {
      setSelectedRowIds(new Set());
    } else {
      const newSelection = new Set(selectedRowIds);
      filteredData.forEach((row) => {
        newSelection.add(getRowId(row));
      });
      setSelectedRowIds(newSelection);
    }
  };

  // Get selection state for header checkbox
  const pageRowCount = paginatedData.length;
  const selectedOnPageCount = paginatedData.filter((row) =>
    selectedRowIds.has(getRowId(row)),
  ).length;
  const isPageAllSelected =
    pageRowCount > 0 && selectedOnPageCount === pageRowCount;
  const isPageIndeterminate =
    selectedOnPageCount > 0 && selectedOnPageCount < pageRowCount;

  const totalSelectedCount = selectedRowIds.size;
  const totalFilteredCount = filteredData.length;
  const isAllFilteredSelected =
    totalFilteredCount > 0 && totalSelectedCount === totalFilteredCount;

  // Selection column definition
  const selectionColumn: Column<T> = {
    key: "_selection",
    header: "",
    cell: (row) => (
      <Checkbox
        checked={isRowSelected(row)}
        onCheckedChange={() => toggleRowSelection(row)}
        onClick={(e) => e.stopPropagation()}
      />
    ),
    className: "w-12 text-center",
    filterable: false,
    hideable: false,
  };

  // Columns filtered by visibility (selection column is always visible)
  const visibleColumns = useMemo(
    () => columns.filter((c) => columnVisibility[c.key] !== false),
    [columns, columnVisibility],
  );

  // Combine columns with selection column at the beginning if enabled
  const displayColumns = enableRowSelection
    ? [selectionColumn, ...visibleColumns]
    : visibleColumns;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex justify-between flex-1 items-center gap-3">
          {searchKeys.length > 0 && (
            <div className="relative flex-1 sm:max-w-md">
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm bg-background"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {enableColumnVisibility && (
              <ColumnVisibilityDropdown
                columns={columns}
                visibility={columnVisibility}
                onToggle={toggleColumnVisibility}
                onShowAll={showAllColumns}
                onHideAll={hideAllColumns}
              />
            )}
            {toolbarActions}
          </div>
        </div>
      </div>

      {/* Selection info bar */}
      {enableRowSelection && totalSelectedCount > 0 && (
        <div className="flex items-center justify-between bg-primary/5 px-4 py-2 rounded-lg">
          <div className="text-sm text-primary">
            {totalSelectedCount} row{totalSelectedCount !== 1 ? "s" : ""}{" "}
            selected
          </div>
          <div className="flex gap-2">
            {totalSelectedCount < totalFilteredCount && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllRowsAcrossPages}
                className="h-7 text-xs"
              >
                Select all {totalFilteredCount} rows
              </Button>
            )}
            {totalSelectedCount === totalFilteredCount &&
              totalFilteredCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllRowsAcrossPages}
                  className="h-7 text-xs"
                >
                  Clear all
                </Button>
              )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRowIds(new Set())}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}


      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <div className="overflow-x-auto">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                {displayColumns.map((column) => {
                  const isFilterable =
                    column.filterable !== false && column.key !== "_selection";
                  const isSelectionColumn = column.key === "_selection";

                  return (
                    <TableHead
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-sm font-semibold text-foreground",
                        column.className,
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isSelectionColumn && enableRowSelection && (
                          <div className="flex items-center gap-1">
                            <Checkbox
                              checked={isPageAllSelected}
                              ref={(ref) => {
                                if (ref) {
                                  (ref as any).indeterminate =
                                    isPageIndeterminate;
                                }
                              }}
                              onCheckedChange={toggleAllRowsOnPage}
                            />
                            {totalFilteredCount > pageRowCount && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 ml-1"
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2">
                                  <div className="text-sm space-y-2">
                                    <p className="text-muted-foreground">
                                      {totalSelectedCount} of{" "}
                                      {totalFilteredCount} rows selected
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={toggleAllRowsAcrossPages}
                                    >
                                      {isAllFilteredSelected
                                        ? "Clear all"
                                        : `Select all ${totalFilteredCount} rows`}
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        )}

                        {!isSelectionColumn && <span>{column.header}</span>}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={displayColumns.length} className="p-0">
                    <Empty className="border-0 rounded-none py-12">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Search />
                        </EmptyMedia>

                        <EmptyTitle>No Results</EmptyTitle>

                        <EmptyDescription>{emptyMessage}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={getRowId(row)}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/30",
                      index % 2 === 0 && "bg-background",
                      index % 2 === 1 && "bg-muted/5",
                      getRowClassName?.(row),
                      enableRowSelection &&
                        isRowSelected(row) &&
                        "bg-primary/5",
                    )}
                  >
                    {displayColumns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn("px-4 py-3 text-sm", column.className)}
                      >
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-17.5 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem
                    key={size}
                    value={size.toString()}
                    className="text-sm"
                  >
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="whitespace-nowrap">entries</span>
          </div>
          <div className="hidden sm:block text-muted-foreground">
            {filteredData.length === 0
              ? "0 entries"
              : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredData.length)} of ${filteredData.length} entries`}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1 || totalPages === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || totalPages === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-[80px] text-center text-sm font-medium">
            Page {currentPage} of {totalPages || 1}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
