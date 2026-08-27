// hooks/useBulkDelete.ts

import { useState } from "react";
import { toast } from "./use-toast";

interface UseBulkDeleteProps<T> {
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  bulkDeleteFn: (ids: (string | number)[]) => Promise<any>;
  getId?: (item: T) => string | number;
}

export function useBulkDelete<T>({
  setItems,
  bulkDeleteFn,
  getId = (item: any) => item.id,
}: UseBulkDeleteProps<T>) {
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const deleteSelected = async () => {
    if (selectedItems.length === 0) return;

    try {
      setLoading(true);

      const ids = selectedItems.map((item) => getId(item));

      await bulkDeleteFn(ids);

      setItems((prev) => prev.filter((item) => !ids.includes(getId(item))));

      setSelectedItems([]);
      toast({
        title: "Success",
        description: "Page deleted successfully",
      });
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast({
        title: "Error",
        description: "Failed to delete pages",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems,
    setSelectedItems,
    deleteSelected,
    clearSelection,
    bulkDeleteLoading: loading,
  };
}
