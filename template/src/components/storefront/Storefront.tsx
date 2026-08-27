"use client";

import Link from "next/link";
import { ArrowUpRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  CartLine,
  Product,
  StorefrontCategory,
  formatMoney,
  getCartTotal,
  getProductById,
} from "@/src/lib/storefront/data";
import { useCart } from "@/src/lib/storefront/cart";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <div className="group flex flex-col gap-4">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute left-3 top-3 text-[10px] uppercase tracking-[0.2em] text-primary">
            {product.badge}
          </span>
        </div>
      </Link>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/products/${product.slug}`}>
          <p className="text-sm">{product.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.category}
          </p>
        </Link>
        <p className="text-sm">{formatMoney(product.price)}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          add({ productId: product.id, product, quantity: 1 });
          setAdded(true);
        }}
        className="inline-flex h-10 items-center justify-center gap-2 border border-border text-sm transition hover:bg-primary hover:text-primary-foreground"
      >
        {added ? "Added to bag" : "Add to bag"}{" "}
        <ShoppingBag className="size-4" />
      </button>
    </div>
  );
}
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
export function CategoryStrip({
  categories,
}: {
  categories: StorefrontCategory[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categories/${category.slug}`}
          className="group relative min-h-64 overflow-hidden bg-muted"
        >
          <img
            src={category.image}
            alt={category.name}
            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-foreground/25" />
          <div className="relative flex h-full min-h-64 flex-col justify-end gap-2 p-6 text-primary-foreground">
            <p className="text-xl">{category.name}</p>
            <p className="max-w-xs text-sm text-primary-foreground/80">
              {category.description}
            </p>
            <ArrowUpRight className="mt-3 size-5" />
          </div>
        </Link>
      ))}
    </div>
  );
}
export function AddToCart({
  product,
  size,
  color,
}: {
  product: Product;
  size?: string;
  color?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  return (
    <button
      onClick={() => {
        add({ productId: product.id, product, quantity: 1, size, color });
        setAdded(true);
      }}
      className="inline-flex h-12 items-center justify-center gap-3 bg-primary px-6 text-sm text-primary-foreground transition hover:bg-primary/90"
    >
      {added ? "Added to bag" : "Add to bag"} <ShoppingBag className="size-4" />
    </button>
  );
}
export function CartSummary({ lines }: { lines: CartLine[] }) {
  const subtotal = getCartTotal(lines);
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-5 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatMoney(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Shipping</span>
        <span>{subtotal >= 150 ? "Complimentary" : formatMoney(12)}</span>
      </div>
      <div className="flex justify-between border-t border-border pt-4 text-base">
        <span>Total</span>
        <span>{formatMoney(subtotal >= 150 ? subtotal : subtotal + 12)}</span>
      </div>
      <Link
        href="/checkout"
        className="flex h-12 items-center justify-center bg-primary text-sm text-primary-foreground hover:bg-primary/90"
      >
        Continue to checkout
      </Link>
    </div>
  );
}
export function CartItems() {
  const { lines, update, remove } = useCart();
  return (
    <div className="flex flex-col divide-y divide-border">
      {lines.map((line, index) => {
        const product = line.product ?? getProductById(line.productId);
        if (!product) return null;
        return (
          <div
            key={`${line.productId}-${line.size}-${line.color}`}
            className="flex gap-4 py-5 first:pt-0"
          >
            <Link
              href={`/products/${product.slug}`}
              className="size-28 shrink-0 overflow-hidden bg-muted"
            >
              <img
                src={product.image}
                alt={product.name}
                className="size-full object-cover"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex justify-between gap-3">
                <div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-sm hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[line.color, line.size].filter(Boolean).join(" / ")}
                  </p>
                </div>
                <span className="text-sm">
                  {formatMoney(product.price * line.quantity)}
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center border border-border">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() =>
                      line.quantity > 1
                        ? update(index, line.quantity - 1)
                        : remove(index)
                    }
                    className="p-2"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="min-w-8 text-center text-xs">
                    {line.quantity}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => update(index, line.quantity + 1)}
                    className="p-2"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
                <button
                  aria-label={`Remove ${product.name}`}
                  onClick={() => remove(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-10 flex flex-wrap gap-2 text-xs text-muted-foreground"
    >
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex gap-2">
          {index > 0 && <span>/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function Newsletter() {
  return (
    <section className="border-y border-border py-16">
      <div className="mx-auto flex max-w-xl flex-col gap-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Stay in the loop
        </p>
        <h2 className="text-3xl tracking-tight">A better inbox.</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Notes on good design, new arrivals, and the things we are looking at.
        </p>
        <form className="flex gap-2">
          <input
            required
            type="email"
            placeholder="Email address"
            className="min-w-0 flex-1 border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button className="bg-primary px-5 text-sm text-primary-foreground">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
export function Benefits() {
  return (
    <div className="grid gap-8 border-y border-border py-8 md:grid-cols-3">
      {[
        "Thoughtfully sourced|Materials and makers chosen with care.",
        "Free shipping|On orders over $150, always.",
        "Easy returns|30 days to decide, no questions asked.",
      ].map((item) => {
        const [title, body] = item.split("|");
        return (
          <div key={title}>
            <p className="text-sm">{title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {body}
            </p>
          </div>
        );
      })}
    </div>
  );
}
