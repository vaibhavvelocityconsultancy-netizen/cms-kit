// In any admin save handler
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/query-key";

export function useAdminSave() {
  const queryClient = useQueryClient();

  const afterSavePage = (slug: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.page(slug),
    });

    queryClient.invalidateQueries({
      queryKey: queryKeys.pages,
    });
  };
  const afterSaveSettings = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    queryClient.invalidateQueries({ queryKey: queryKeys.globalCss });
  };

  const afterSaveMenus = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.menus });
    queryClient.invalidateQueries({ queryKey: queryKeys.footerMenus });
  };

  const afterSaveFooter = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.footerSettings });
  };

  return { afterSavePage, afterSaveSettings, afterSaveMenus, afterSaveFooter };
}
