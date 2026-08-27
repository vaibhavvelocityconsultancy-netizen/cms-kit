"use client";

import React from "react";
import { 
  Search, 
  Trash2, 
  Grid3x3, 
  List, 
  X, 
  Filter, 
  Image, 
  Video, 
  Music, 
  FileText,
  File,
  ChevronDown 
} from "lucide-react";
import { Input } from "@/src/ui/input";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/src/ui/dropdown-menu";
import { ViewMode } from "./MediaManager";

export type MediaType = "all" | "image" | "video" | "audio" | "document" | "other";

export interface MediaFilter {
  type: MediaType;
  dateRange?: "all" | "today" | "week" | "month" | "year";
  sortBy?: "date" | "name" | "size";
  sortOrder?: "asc" | "desc";
}

interface MediaToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filter: MediaFilter;
  onFilterChange: (filter: MediaFilter) => void;
  totalItems?: number;
  filteredCount?: number;
}

export function MediaToolbar({
  searchQuery,
  onSearchChange,
  selectedCount,
  onBulkDelete,
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
  totalItems = 0,
  filteredCount = 0,
}: MediaToolbarProps) {
  
  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "audio":
        return <Music className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: MediaType): string => {
    switch (type) {
      case "all":
        return "All Media";
      case "image":
        return "Images";
      case "video":
        return "Videos";
      case "audio":
        return "Audio";
      case "document":
        return "Documents";
      case "other":
        return "Other";
      default:
        return "All Media";
    }
  };

  const handleTypeChange = (type: MediaType) => {
    onFilterChange({ ...filter, type });
  };

  const handleSortChange = (sortBy: "date" | "name" | "size") => {
    const sortOrder = filter.sortBy === sortBy && filter.sortOrder === "asc" ? "desc" : "asc";
    onFilterChange({ ...filter, sortBy, sortOrder });
  };

  const handleDateRangeChange = (dateRange: "all" | "today" | "week" | "month" | "year") => {
    onFilterChange({ ...filter, dateRange });
  };

  const clearFilters = () => {
    onFilterChange({
      type: "all",
      dateRange: "all",
      sortBy: "date",
      sortOrder: "desc",
    });
    onSearchChange("");
  };

  const hasActiveFilters = filter.type !== "all" || filter.dateRange !== "all" || searchQuery;

  return (
    <div className="space-y-4 mb-6">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border p-2 bg-zinc-50 rounded-md dark:bg-zinc-800">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, alt text, or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5">
                    {[
                      filter.type !== "all" && getTypeLabel(filter.type),
                      filter.dateRange !== "all" && filter.dateRange,
                      searchQuery && "Search",
                    ].filter(Boolean).length}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Media Type</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleTypeChange("all")} className="gap-2">
                <File className="w-4 h-4" />
                All Media
                {filter.type === "all" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange("image")} className="gap-2">
                <Image className="w-4 h-4" />
                Images
                {filter.type === "image" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange("video")} className="gap-2">
                <Video className="w-4 h-4" />
                Videos
                {filter.type === "video" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange("audio")} className="gap-2">
                <Music className="w-4 h-4" />
                Audio
                {filter.type === "audio" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange("document")} className="gap-2">
                <FileText className="w-4 h-4" />
                Documents
                {filter.type === "document" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange("other")} className="gap-2">
                <File className="w-4 h-4" />
                Other
                {filter.type === "other" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
{/* 
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Date Range</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleDateRangeChange("all")}>
                All Time
                {filter.dateRange === "all" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeChange("today")}>
                Today
                {filter.dateRange === "today" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeChange("week")}>
                This Week
                {filter.dateRange === "week" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeChange("month")}>
                This Month
                {filter.dateRange === "month" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeChange("year")}>
                This Year
                {filter.dateRange === "year" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleSortChange("date")}>
                Date {filter.sortBy === "date" && (filter.sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("name")}>
                Name {filter.sortBy === "name" && (filter.sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("size")}>
                Size {filter.sortBy === "size" && (filter.sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem> */}

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters} className="text-destructive">
                    Clear All Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Delete Badge */}
          {selectedCount > 0 && (
            <Badge variant="secondary" className="gap-2 px-3 py-1.5">
              <span>{selectedCount} selected</span>
              <button 
                onClick={onBulkDelete} 
                className="hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Badge>
          )}
          
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border">
            <button
              className={cn(
                "p-2 px-3 rounded-l-lg transition-all",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              )}
              onClick={() => onViewModeChange("grid")}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              className={cn(
                "p-2 px-3 rounded-r-lg transition-all",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              )}
              onClick={() => onViewModeChange("list")}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filter.type !== "all" && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              {getTypeIcon(filter.type)}
              <span>{getTypeLabel(filter.type)}</span>
              <button
                onClick={() => handleTypeChange("all")}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {filter.dateRange !== "all" && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              <span>
                {filter.dateRange === "today" && "Today"}
                {filter.dateRange === "week" && "This Week"}
                {filter.dateRange === "month" && "This Month"}
                {filter.dateRange === "year" && "This Year"}
              </span>
              <button
                onClick={() => handleDateRangeChange("all")}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {searchQuery && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              <span>Search: "{searchQuery}"</span>
              <button
                onClick={() => onSearchChange("")}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
      
      {/* Results Count */}
      {(totalItems > 0 || filteredCount > 0) && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalItems} media items
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Check icon component for dropdown menu
function Check({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}