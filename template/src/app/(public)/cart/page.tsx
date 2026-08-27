"use client";
import Link from "next/link";
import { CartItems, CartSummary } from "@/src/components/storefront/Storefront";
import { useCart } from "@/src/lib/storefront/cart";
export default function CartPage() {
  const { lines, loading } = useCart();
  return (
    <main className="mx-auto w-full px-5 py-16 md:px-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Your bag
      </p>
      <h1 className="mt-3 text-5xl tracking-tight">Your selected pieces.</h1>
      {loading ? (
        <div className="mt-16 border-t border-border pt-8 text-sm text-muted-foreground">
          Loading your bag...
        </div>
      ) : lines.length ? (
        <div className="mt-16 grid gap-12 md:grid-cols-[1.2fr_0.8fr]">
          <CartItems />
          <CartSummary lines={lines} />
        </div>
      ) : (
        <div className="mt-16 flex flex-col gap-5 border-t border-border pt-8">
          <p className="text-lg">Your cart is ready when you are.</p>
          <Link
            href="/shop"
            className="w-fit bg-primary px-5 py-3 text-sm text-primary-foreground"
          >
            Explore the collection
          </Link>
        </div>
      )}
    </main>
  );
}
