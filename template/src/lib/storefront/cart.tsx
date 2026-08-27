"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getApiUrl } from "@/src/lib/config";
import { CartLine, Product } from "./data";

type CartContextValue = {
  lines: CartLine[];
  loading: boolean;
  add: (line: CartLine) => Promise<void>;
  update: (index: number, quantity: number) => Promise<void>;
  remove: (index: number) => Promise<void>;
  clear: () => Promise<void>;
  count: number;
  total: number;
};
const CartContext = createContext<CartContextValue | null>(null);

type CartApiItem = {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  product: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    shortDescription?: string | null;
    price: number;
    categories?: { name: string; slug: string }[];
    images?: { url: string; altText?: string | null }[];
  };
};

function toProduct(item: CartApiItem): Product {
  const category = item.product.categories?.[0];
  const images =
    item.product.images?.map((image) => image.url).filter(Boolean) ?? [];
  return {
    id: item.product.id,
    slug: item.product.slug,
    name: item.product.title,
    category: category?.name ?? "Shop",
    categorySlug: category?.slug ?? "all",
    price: Number(item.product.price),
    description:
      item.product.description || item.product.shortDescription || "",
    details: [],
    image: images[0] ?? "/placeholder-product.svg",
    gallery: images.length ? images : ["/placeholder-product.svg"],
    colors: [],
    sizes: [],
  };
}

function toLines(items: CartApiItem[]): CartLine[] {
  return items.map((item) => ({
    itemId: item.id,
    productId: item.productId,
    variantId: item.variantId ?? undefined,
    quantity: item.quantity,
    product: toProduct(item),
  }));
}

async function requestCart(method: string, body?: object) {
  const response = await fetch(getApiUrl("/api/public/ecommerce/cart"), {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok || !result.success)
    throw new Error(result.message || "Cart request failed");
  return result.data as { items: CartApiItem[] };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    requestCart("GET")
      .then((cart) => setLines(toLines(cart.items)))
      .catch(() => setLines([]))
      .finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    const cart = await requestCart("GET");
    setLines(toLines(cart.items));
  };

  const value = useMemo(
    () => ({
      lines,
      loading,
      add: async (line: CartLine) => {
        await requestCart("POST", {
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
        });
        await refresh();
      },
      update: async (index: number, quantity: number) => {
        const item = lines[index];
        if (!item?.itemId) return;
        await requestCart("PATCH", { itemId: item.itemId, quantity });
        await refresh();
      },
      remove: async (index: number) => {
        const item = lines[index];
        if (!item?.itemId) return;
        await requestCart("DELETE", { itemId: item.itemId });
        await refresh();
      },
      clear: async () => {
        await requestCart("DELETE");
        setLines([]);
      },
      count: lines.reduce((total, line) => total + line.quantity, 0),
      total: lines.reduce(
        (total, line) => total + (line.product?.price ?? 0) * line.quantity,
        0,
      ),
    }),
    [lines, loading],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
