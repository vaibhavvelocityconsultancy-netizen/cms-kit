import { useState, useEffect } from "react";
import { getBaseUrl } from "@/src/lib/config";

export interface PreviewMenuItem {
  id: string;
  label: string;
  type: string;
  url?: string | null;
  slug?: string | null;
  parentId?: string | null;
  children?: PreviewMenuItem[];
}

export interface PreviewMenu {
  id: string;
  name: string;
  location: string;
  menuitem?: PreviewMenuItem[];
  menuitems?: PreviewMenuItem[];
  items?: PreviewMenuItem[];
}

function normalizePreviewMenu(menu: any): PreviewMenu {
  return {
    ...menu,
    menuitem: menu.menuitem ?? menu.menuitems ?? menu.items ?? [],
  };
}

export function useMenusPreview() {
  const [menus, setMenus] = useState<PreviewMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/api/menus`);
        const data = await response.json();

        if (data.success && data.data) {
          setMenus(data.data.map(normalizePreviewMenu));
        } else {
          setError(data.message || "Failed to fetch menus");
          setMenus([]);
        }
      } catch (err) {
        console.error("Failed to fetch menus:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch menus");
        setMenus([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  return { menus, loading, error };
}
