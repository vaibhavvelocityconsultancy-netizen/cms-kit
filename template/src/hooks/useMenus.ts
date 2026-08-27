import { useState, useEffect, useMemo, useCallback } from "react";
import { getApiBaseUrl } from "@/src/lib/axios";

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

async function readJsonResponse(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      text.trim().startsWith("<")
        ? `Request failed with a non-JSON response (${res.status})`
        : text || `Request failed (${res.status})`,
    );
  }

  return res.json();
}

interface MenuItem {
  id: number;
  label: string;
  type: "page" | "custom";
  slug: string | null;
  url: string | null;
  order: number;
  parentId?: number | null;
  menuId: number;
}

interface Menu {
  id: number;
  name: string;
  location: string;
  menuitem: MenuItem[];
}

interface ReorderItem {
  id: number;
  order: number;
  parentId?: number | null;
}

interface AddMenuItemInput {
  label: string;
  type: "page" | "custom";
  slug?: string | null;
  url?: string | null;
}

interface UpdateMenuInput {
  name?: string;
  location?: string;
  items?: AddMenuItemInput[];
}

export function useMenus() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local drafts for menu fields (e.g. name) to avoid API calls on every keystroke
  const [menuDrafts, setMenuDrafts] = useState<
    Record<number, { name?: string }>
  >({});

  useEffect(() => {
    fetchMenus();
  }, []);

  // GET /api/menus - Get all menus
  async function fetchMenus() {
    try {
      setLoading(true);

      const res = await fetch(apiPath("/api/menus"));
      const data = await readJsonResponse(res);

      if (!res.ok) throw new Error(data.message);

      const menus = data.data.map((menu: any) => ({
        ...menu,
        menuitem: menu.menuitem || [],
      }));

      setMenus(menus);
    } catch (err: any) {
      setError(err.message || "Failed to fetch menus");
    } finally {
      setLoading(false);
    }
  }
  // GET /api/menus/[id] - Get single menu (used by refreshMenu)
  async function getMenuById(id: number): Promise<Menu> {
    const res = await fetch(apiPath(`/api/menus/${id}`));
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.message);
    return data.data;
  }

  // POST /api/menus - Create new menu
  async function createMenu(input: {
    name: string;
    location: string;
  }): Promise<Menu> {
    const res = await fetch(apiPath("/api/menus"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        location: input.location,
        items: [],
      }),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.message);
    setMenus((prev) => [...prev, data.data]);
    return data.data;
  }

  // PUT /api/menus/[id] - Update menu
  async function updateMenu(
    id: number,
    updates: UpdateMenuInput,
  ): Promise<Menu> {
    const res = await fetch(apiPath(`/api/menus/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.message);
    setMenus((prev) => prev.map((m) => (m.id === id ? data.data : m)));
    // clear draft for this menu
    setMenuDrafts((d) => {
      const copy = { ...d };
      delete copy[id];
      return copy;
    });
    return data.data;
  }

  // DELETE /api/menus/[id] - Delete menu
  async function deleteMenu(id: number): Promise<void> {
    const res = await fetch(apiPath(`/api/menus/${id}`), { method: "DELETE" });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.message);
    setMenus((prev) => prev.filter((m) => m.id !== id));
  }

  // POST /api/menus/[id]/items - Add item to menu
  async function addMenuItem(
    menuId: number,
    item: AddMenuItemInput,
  ): Promise<MenuItem> {
    const res = await fetch(apiPath(`/api/menus/${menuId}/items`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.message);
    await refreshMenu(menuId);
    return data.data;
  }

  // PUT /api/menus/[id]/items/[itemId] - Update single item
  async function updateMenuItem(
    menuId: number,
    itemId: number,
    updates: {
      label: string;
      type: "page" | "custom";
      slug?: string | null;
      url?: string | null;
    },
  ): Promise<MenuItem> {
    const res = await fetch(apiPath(`/api/menus/${menuId}/items/${itemId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.message);
    await refreshMenu(menuId);
    return data.data;
  }

  // DELETE /api/menus?menuId=[id]&itemId=[itemId] - Delete single item
  async function deleteMenuItem(menuId: number, itemId: number): Promise<void> {
    const res = await fetch(apiPath(`/api/menus?menuId=${menuId}&itemId=${itemId}`), {
      method: "DELETE",
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.message);
    await refreshMenu(menuId);
  }

  // PUT /api/menus/[id]/items - Reorder all items
  async function reorderMenuItems(
    menuId: number,
    items: ReorderItem[],
  ): Promise<void> {
    // Optimistic update: apply order/parentId locally immediately
    const prevMenus = menus;
    setMenus((prev) =>
      prev.map((m) => {
        if (m.id !== menuId) return m;
        // build a map for quick lookup
        const byId = new Map<number, any>();
        (m.menuitem || []).forEach((it: any) => byId.set(it.id, { ...it }));
        items.forEach((u) => {
          const it = byId.get(u.id);
          if (it) {
            it.order = u.order;
            it.parentId = u.parentId ?? null;
          }
        });
        const newMenu = { ...m, menuitem: Array.from(byId.values()) };
        return newMenu;
      }),
    );

    // Fire the API call; if it fails, revert and throw
    const res = await fetch(apiPath(`/api/menus/${menuId}/items`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const data = await readJsonResponse(res);

    if (!res.ok) {
      // revert
      setMenus(prevMenus);
      throw new Error(data.message);
    }
  }

  // GET /api/menus/location/[location] - Get menu by location
  async function getMenuByLocation(
    location: "header" | "footer",
  ): Promise<Menu> {
    const res = await fetch(apiPath(`/api/menus/location/${location}`));
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.message);
    return data.data;
  }

  // Helper to refresh a single menu
  async function refreshMenu(menuId: number): Promise<Menu> {
    const menu = await getMenuById(menuId);
    setMenus((prev) => prev.map((m) => (m.id === menuId ? menu : m)));
    return menu;
  }

  // Helper: set a local draft for menu (does NOT call API). Useful for name editing.
  const setMenuDraft = useCallback(
    (menuId: number, fields: { name?: string }) => {
      setMenuDrafts((d) => ({
        ...d,
        [menuId]: { ...(d[menuId] || {}), ...fields },
      }));
      setMenus((prev) =>
        prev.map((m) => (m.id === menuId ? { ...m, ...fields } : m)),
      );
    },
    [],
  );

  // Helper: commit draft fields by calling updateMenu API (merge into existing updates)
  const commitMenuDraft = useCallback(
    async (menuId: number) => {
      const draft = menuDrafts[menuId];
      if (!draft) return null;
      try {
        const updated = await updateMenu(menuId, { name: draft.name });
        return updated;
      } catch (err) {
        // keep draft, rethrow
        throw err;
      }
    },
    [menuDrafts, updateMenu],
  );

  // Memoized accessor for building/flattening trees per menu id to avoid recomputation
const buildTree = useCallback((items: any[]) => {
  const map = new Map<number, any>();
  items.forEach((item) => map.set(item.id, { ...item, children: [] }));

  const roots: any[] = [];
  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!;
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByOrder = (nodes: any[]) => {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    nodes.forEach((n) => sortByOrder(n.children));
  };
  sortByOrder(roots);

  return roots;
}, []);


  const flattenTree = useCallback(
    (nodes: any[], parentId: number | null = null, depth = 0) => {
      const result: any[] = [];
      nodes.forEach((node) => {
        result.push({ ...node, parentId, depth });
        if (node.children?.length) {
          result.push(...flattenTree(node.children, node.id, depth + 1));
        }
      });
      return result;
    },
    [buildTree],
  );

  // Expose helpers to get memoized flatItems for a given menu id
  const getFlatItems = useCallback(
    (menuId: number) => {
      const menu = menus.find((m) => m.id === menuId);
      if (!menu) return [];
      // useMemo-like behavior: compute quickly (caller is expected to useMemo if needed)
      const tree = buildTree(menu.menuitem || []);
      return flattenTree(tree);
    },
    [menus, buildTree, flattenTree],
  );

  return {
    menus,
    loading,
    error,
    createMenu,
    updateMenu,
    deleteMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderMenuItems,
    getMenuByLocation, // Added this useful function
    refreshMenu,
    // new helpers
    setMenuDraft,
    commitMenuDraft,
    getFlatItems,
  };
}
