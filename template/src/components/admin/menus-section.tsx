"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Trash2,
  X,
  Link as LinkIcon,
  FileText,
  Loader2,
  GripVertical,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  Edit2,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useMenus } from "@/src/hooks/useMenus";
import { usePages, Page } from "@/src/hooks/usePages";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: number;
  label: string;
  type: "page" | "custom";
  slug?: string | null;
  url?: string | null;
  parentId?: number | null;
  order?: number;
  children?: MenuItem[];
}

// Tree helpers are provided by `useMenus.getFlatItems` (memoized there)

// ── Menu Item Row ──────────────────────────────────────────────────────────────

interface MenuItemRowProps {
  item: MenuItem & { depth: number };
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
  onIndent: (id: number) => void;
  onOutdent: (id: number) => void;
  onEdit: (item: MenuItem & { depth: number }) => void;
  onDelete: (id: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

function MenuItemRow({
  item,
  onMoveUp,
  onMoveDown,
  onIndent,
  onOutdent,
  onEdit,
  onDelete,
  isFirst,
  isLast,
}: MenuItemRowProps) {
  const { depth } = item;
  const hasChildren = (item.children?.length ?? 0) > 0;

  return (
    <div
      className="flex items-center gap-2 p-3 border-b border-border hover:bg-muted/30 transition-colors"
      style={{ paddingLeft: `${depth * 28 + 12}px` }}
    >
      {depth > 0 && (
        <span className="text-muted-foreground/40 text-xs select-none mr-0.5">
          └
        </span>
      )}

      <GripVertical size={15} className="text-muted-foreground/50 shrink-0" />

      {hasChildren ? (
        <ChevronDownIcon size={13} className="text-muted-foreground shrink-0" />
      ) : (
        <span className="w-3.5 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <span className="font-medium text-foreground text-sm">
          {item.label}
        </span>
        <span className="ml-2 text-xs font-mono text-muted-foreground truncate">
          {item.type === "page" ? `/${item.slug || ""}` : item.url}
        </span>
      </div>

      <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground shrink-0">
        {item.type}
      </span>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onMoveUp(item.id)}
          disabled={isFirst}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => onMoveDown(item.id)}
          disabled={isLast}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
          <ChevronDown size={14} />
        </button>
        <button
          onClick={() => onIndent(item.id)}
          disabled={depth >= 3 || isFirst}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Make child of previous item (indent)"
        >
          <ArrowRight size={14} />
        </button>
        <button
          onClick={() => onOutdent(item.id)}
          disabled={depth === 0}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Make sibling of parent (outdent)"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          onClick={() => onEdit(item)}
          className="p-1 hover:bg-muted rounded transition-colors"
          title="Edit item"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 hover:bg-muted rounded transition-colors hover:text-destructive"
          title="Delete item"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Edit Item Modal ──────────────────────────────────────────────────────────────

interface EditItemModalProps {
  item: (MenuItem & { depth: number }) | null;
  pages: Page[];
  onSave: (
    itemId: number,
    updates: {
      label: string;
      type: "page" | "custom";
      slug?: string | null;
      url?: string | null;
    },
  ) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function EditItemModal({
  item,
  pages,
  onSave,
  onClose,
  saving,
}: EditItemModalProps) {
  const [label, setLabel] = useState(item?.label || "");
  const [pageSlug, setPageSlug] = useState(item?.slug || "");
  const [url, setUrl] = useState(item?.url || "");

  useEffect(() => {
    if (item) {
      setLabel(item.label);
      setPageSlug(item.slug || "");
      setUrl(item.url || "");
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(item.id, {
      label,
      type: item.type,
      ...(item.type === "page" ? { slug: pageSlug } : { url }),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Edit Menu Item
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full p-2 bg-input text-foreground border border-border outline-none focus:border-primary"
              required
            />
          </div>

          {item.type === "page" ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Page
              </label>
              <select
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                className="w-full p-2 bg-input text-foreground border border-border outline-none focus:border-primary"
                required
              >
                <option value="">Select a page...</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.slug}>
                    {page.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/path or https://..."
                className="w-full p-2 bg-input text-foreground border border-border outline-none focus:border-primary"
                required
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface MenusSectionProps {
  pages: Page[];
}

export function MenusSection() {
  const {
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
    setMenuDraft,
    commitMenuDraft,
    getFlatItems,
  } = useMenus();

  // ── UI state ───────────────────────────────────────────
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<
    (MenuItem & { depth: number }) | null
  >(null);
  const [newItemType, setNewItemType] = useState<"page" | "custom">("page");
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemPageSlug, setNewItemPageSlug] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [editingMenuName, setEditingMenuName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Create menu form state ─────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuLocation, setNewMenuLocation] = useState<"header" | "footer">(
    "header",
  );

  const [menuName, setMenuName] = useState("");
  // use React Query for pages with 10 minute staleTime
  const pagesQuery = usePages();
  const pages: Page[] = (pagesQuery.data as Page[]) ?? [];
  const pagesLoading = pagesQuery.isLoading;

  // ── Derived ────────────────────────────────────────────
  const selectedMenu =
    menus.find((m) => m.id === selectedMenuId) ?? menus[0] ?? null;

  useEffect(() => {
    if (selectedMenu) {
      setMenuName(selectedMenu.name);
    }
  }, [selectedMenu]);

  const flatItems = useMemo(() => {
    if (!selectedMenu) return [];
    return getFlatItems(selectedMenu.id);
  }, [selectedMenu?.id, getFlatItems]);

  // ── Menu CRUD handlers ────────────────────────────────

  const handleCreateMenu = async () => {
    if (!newMenuName.trim()) {
      setActionError("Menu name is required");
      return;
    }
    try {
      setSaving(true);
      setActionError(null);
      const menu = await createMenu({
        name: newMenuName.trim(),
        location: newMenuLocation,
      });
      setSelectedMenuId(menu.id);
      setShowCreateForm(false);
      setNewMenuName("");
      setNewMenuLocation("header");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMenu = async (updates: object) => {
    if (!selectedMenu) return;
    try {
      setSaving(true);
      setActionError(null);
      await updateMenu(selectedMenu.id, updates);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm("Are you sure you want to delete this menu?")) return;
    try {
      await deleteMenu(id);
      setSelectedMenuId(null);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleAddItem = async () => {
    if (!selectedMenu) return;
    try {
      setSaving(true);
      setActionError(null);
      await addMenuItem(selectedMenu.id, {
        label:
          newItemLabel ||
          (newItemType === "page"
            ? pages.find((p) => p.slug === newItemPageSlug)?.title || "Item"
            : "Link"),
        type: newItemType,
        slug: newItemType === "page" ? newItemPageSlug : null,
        url: newItemType === "custom" ? newItemUrl : null,
      });
      setAddingItem(false);
      setNewItemLabel("");
      setNewItemPageSlug("");
      setNewItemUrl("");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMenuItem = async (
    itemId: number,
    updates: {
      label: string;
      type: "page" | "custom";
      slug?: string | null;
      url?: string | null;
    },
  ) => {
    if (!selectedMenu) return;
    try {
      setSaving(true);
      setActionError(null);
      await updateMenuItem(selectedMenu.id, itemId, updates);
      setEditingItem(null);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to remove this menu item?")) return;
    if (!selectedMenu) return;
    try {
      await deleteMenuItem(selectedMenu.id, itemId);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // ── Item movement handlers ─────────────────────────────

  const getSubtreeRange = useCallback(
    (items: typeof flatItems, startIndex: number) => {
      const startDepth = items[startIndex].depth;
      let endIndex = startIndex;

      for (let i = startIndex + 1; i < items.length; i++) {
        if (items[i].depth <= startDepth) break;
        endIndex = i;
      }

      return { startIndex, endIndex };
    },
    [],
  );
  const handleMoveUp = useCallback(
    (id: number) => {
      if (!selectedMenu) return;
      const index = flatItems.findIndex((i) => i.id === id);
      if (index <= 0) return;
      const current = flatItems[index];

      // find nearest previous sibling (same parentId)
      let siblingIndex = -1;
      for (let i = index - 1; i >= 0; i--) {
        if (flatItems[i].depth < current.depth) break; // walked past parent
        if (flatItems[i].parentId === current.parentId) {
          siblingIndex = i;
          break;
        }
      }
      if (siblingIndex === -1) return; // already first among its siblings

      const newItems = [...flatItems];
      const swapOrder = newItems[siblingIndex].order;
      newItems[siblingIndex] = {
        ...newItems[siblingIndex],
        order: current.order,
      };
      newItems[index] = { ...current, order: swapOrder };

      const reindexedItems = newItems.map((item) => ({
        id: item.id,
        order: item.order,
        parentId: item.parentId ?? null,
      }));

      reorderMenuItems(selectedMenu.id, reindexedItems).catch((err) =>
        setActionError(err.message),
      );
    },
    [selectedMenu?.id, flatItems, reorderMenuItems],
  );

  const handleMoveDown = useCallback(
    (id: number) => {
      if (!selectedMenu) return;
      const index = flatItems.findIndex((i) => i.id === id);
      if (index === -1) return;
      const current = flatItems[index];

      let siblingIndex = -1;
      for (let i = index + 1; i < flatItems.length; i++) {
        if (flatItems[i].depth < current.depth) break; // walked out of parent scope
        if (flatItems[i].parentId === current.parentId) {
          siblingIndex = i;
          break;
        }
      }
      if (siblingIndex === -1) return; // already last among its siblings

      const newItems = [...flatItems];
      const swapOrder = newItems[siblingIndex].order;
      newItems[siblingIndex] = {
        ...newItems[siblingIndex],
        order: current.order,
      };
      newItems[index] = { ...current, order: swapOrder };

      const reindexedItems = newItems.map((item) => ({
        id: item.id,
        order: item.order,
        parentId: item.parentId ?? null,
      }));

      reorderMenuItems(selectedMenu.id, reindexedItems).catch((err) =>
        setActionError(err.message),
      );
    },
    [selectedMenu?.id, flatItems, reorderMenuItems],
  );
  const handleIndent = useCallback(
    (id: number) => {
      if (!selectedMenu) return;
      const index = flatItems.findIndex((i) => i.id === id);
      if (index <= 0) return;

      const currentItem = flatItems[index];
      if (currentItem.depth >= 3) return;

      // Find nearest preceding sibling (same depth) — that item becomes the new parent
      let newParent: (typeof flatItems)[0] | null = null;
      for (let i = index - 1; i >= 0; i--) {
        if (flatItems[i].depth === currentItem.depth) {
          newParent = flatItems[i];
          break;
        }
        if (flatItems[i].depth < currentItem.depth) break;
      }

      if (!newParent) return;

      const newItems = flatItems.map((item) =>
        item.id === id ? { ...item, parentId: newParent!.id } : item,
      );

      // rebuild ordering by flattening using getFlatItems workaround: compute new order sequentially
      const reindexedItems = newItems.map((item, idx) => ({
        id: item.id,
        order: idx,
        parentId: item.parentId ?? null,
      }));
      reorderMenuItems(selectedMenu.id, reindexedItems).catch((err) =>
        setActionError(err.message),
      );
    },
    [selectedMenu?.id, flatItems, reorderMenuItems],
  );

  const handleOutdent = useCallback(
    (id: number) => {
      if (!selectedMenu) return;
      const index = flatItems.findIndex((i) => i.id === id);
      if (index === -1) return;

      const currentItem = flatItems[index];
      if (currentItem.depth === 0) return;

      // Find the grandparent (item at depth-1)
      let grandparentId: number | null = null;
      for (let i = index - 1; i >= 0; i--) {
        if (flatItems[i].depth === currentItem.depth - 1) {
          grandparentId = flatItems[i].parentId;
          break;
        }
      }

      // Update parent for the moved item
      const newItems = flatItems.map((item) =>
        item.id === id ? { ...item, parentId: grandparentId } : item,
      );

      const reindexedItems = newItems.map((item, idx) => ({
        id: item.id,
        order: idx,
        parentId: item.parentId ?? null,
      }));
      reorderMenuItems(selectedMenu.id, reindexedItems).catch((err) =>
        setActionError(err.message),
      );
    },
    [selectedMenu?.id, flatItems, reorderMenuItems],
  );

  const updateItemOrder = async (
    items: Array<MenuItem & { depth: number; parentId: number | null }>,
  ) => {
    if (!selectedMenu) return;
    // Convert to API format and call reorder (optimistic inside hook)
    const updatedItems = items.map((item) => ({
      id: item.id,
      order: item.order ?? 0,
      parentId: item.parentId ?? null,
    }));
    setSaving(true);
    reorderMenuItems(selectedMenu.id, updatedItems)
      .catch((err: any) => setActionError(err.message))
      .finally(() => setSaving(false));
  };

  // ── Render ────────────────────────────────────────────

  if (loading)
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading menus...
      </div>
    );

  if (error)
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        {error}
      </div>
    );

  return (
    <>
      {actionError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center justify-between">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-2">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          pages={pages}
          onSave={handleUpdateMenuItem}
          onClose={() => setEditingItem(null)}
          saving={saving}
        />
      )}

      <div className="flex h-full px-5">
        {/* ── Sidebar ─────────────────────────────────────── */}
        <div className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-sans font-bold text-foreground">Menus</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="p-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              app/admin/menus/page.tsx
            </p>
          </div>

          {showCreateForm && (
            <div className="p-3 border-b border-border bg-muted/20">
              <input
                type="text"
                placeholder="Menu name"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateMenu()}
                className="w-full p-2 mb-2 text-sm bg-input text-foreground border border-border outline-none focus:border-primary"
                autoFocus
              />
              <select
                value={newMenuLocation}
                onChange={(e) => setNewMenuLocation(e.target.value as any)}
                className="w-full p-2 mb-3 text-sm bg-input text-foreground border border-border outline-none focus:border-primary"
              >
                <option value="header">Header</option>
                <option value="footer">Footer</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateMenu}
                  disabled={saving}
                  className="flex-1 py-1.5 bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {saving && <Loader2 size={10} className="animate-spin" />}
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewMenuName("");
                    setNewMenuLocation("header");
                  }}
                  className="flex-1 py-1.5 bg-muted text-muted-foreground text-xs hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="p-2 flex-1 overflow-auto">
            {menus.length === 0 && !showCreateForm ? (
              <p className="p-3 text-xs text-muted-foreground text-center">
                No menus yet. Click + to create one.
              </p>
            ) : (
              menus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => setSelectedMenuId(menu.id)}
                  className={`w-full text-left px-3 py-2 mb-1 transition-all ${
                    selectedMenu?.id === menu.id
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="text-sm font-medium">{menu.name}</span>
                  <span className="block text-xs font-mono text-muted-foreground/60">
                    {menu.location}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Main Editor ───────────────────────────────────── */}
        {selectedMenu ? (
          <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-3xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                {editingMenuName ? (
                  <input
                    type="text"
                    value={menuName}
                    onChange={(e) => {
                      setMenuName(e.target.value);
                      // update local draft for instant UI update in sidebar
                      if (selectedMenu)
                        setMenuDraft(selectedMenu.id, { name: e.target.value });
                    }}
                    onBlur={async () => {
                      if (selectedMenu && menuName !== selectedMenu.name) {
                        try {
                          await commitMenuDraft(selectedMenu.id);
                        } catch (err: any) {
                          setActionError(err.message);
                        }
                      }

                      setEditingMenuName(false);
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && selectedMenu) {
                        if (menuName !== selectedMenu.name) {
                          try {
                            await commitMenuDraft(selectedMenu.id);
                          } catch (err: any) {
                            setActionError(err.message);
                          }
                        }

                        setEditingMenuName(false);
                      }
                    }}
                    className="bg-transparent text-2xl font-bold text-foreground border-b border-primary outline-none"
                    autoFocus
                  />
                ) : (
                  <h1
                    onClick={() => setEditingMenuName(true)}
                    className="font-sans text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                  >
                    {selectedMenu.name}
                  </h1>
                )}
                <button
                  onClick={() => handleDeleteMenu(selectedMenu.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Controls Hint */}
              <div className="mb-4 p-3 bg-muted/30 rounded border border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <ChevronUp size={12} /> <ChevronDown size={12} /> Move
                    up/down
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowRight size={12} /> Indent (make child of previous)
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowLeft size={12} /> Outdent (move to parent's level)
                  </span>
                </p>
              </div>

              {/* Menu Items */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    Menu Items
                  </label>
                  <button
                    onClick={() => setAddingItem(true)}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div className="bg-card border border-border rounded overflow-hidden">
                  {flatItems.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      No items yet. Add your first menu item.
                    </p>
                  ) : (
                    flatItems.map((item, index) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onIndent={handleIndent}
                        onOutdent={handleOutdent}
                        onEdit={setEditingItem}
                        onDelete={handleRemoveItem}
                        isFirst={index === 0}
                        isLast={index === flatItems.length - 1}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Add Item Form */}
              {addingItem && (
                <div className="mb-6 p-4 bg-card border border-border rounded">
                  <h3 className="font-medium text-foreground mb-4">
                    Add Menu Item
                  </h3>
                  <div className="flex gap-2 mb-4">
                    {(["page", "custom"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewItemType(type)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-all ${
                          newItemType === type
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {type === "page" ? (
                          <FileText size={14} />
                        ) : (
                          <LinkIcon size={14} />
                        )}
                        {type === "page" ? "Page" : "Custom Link"}
                      </button>
                    ))}
                  </div>

                  {newItemType === "page" ? (
                    <select
                      value={newItemPageSlug}
                      onChange={(e) => setNewItemPageSlug(e.target.value)}
                      className="w-full p-2 mb-3 bg-input text-foreground border border-border outline-none focus:border-primary"
                    >
                      <option value="">Select a page...</option>
                      {pages.map((page) => (
                        <option key={page.id} value={page.slug}>
                          {page.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Label"
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                        className="w-full p-2 mb-3 bg-input text-foreground border border-border outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="URL (e.g., /page or https://...)"
                        value={newItemUrl}
                        onChange={(e) => setNewItemUrl(e.target.value)}
                        className="w-full p-2 mb-3 bg-input text-foreground border border-border outline-none focus:border-primary"
                      />
                    </>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddItem}
                      disabled={saving}
                      className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving && <Loader2 size={12} className="animate-spin" />}
                      Add
                    </button>
                    <button
                      onClick={() => setAddingItem(false)}
                      className="px-4 py-1.5 bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select or create a menu
          </div>
        )}
      </div>
    </>
  );
}
