import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/axios";

// GET
export function useBreadcrumbSettings() {
  return useQuery({
    queryKey: ["breadcrumb-settings"],
    queryFn: async () => {
      const { data } = await api.get("/api/breadcramps");
      return data.data;
    },
  });
}

// UPDATE
export function useUpdateBreadcrumbSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put("/api/breadcramps", payload);
      return data.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["breadcrumb-settings"],
      });
      queryClient.invalidateQueries({
        queryKey: ["public", "bootstrap"],
      });
    },
  });
}
