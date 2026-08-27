import Link from "next/link";
import {
  CategoryStrip,
  ProductGrid,
  Benefits,
  Newsletter,
} from "@/src/components/storefront/Storefront";
import {
  fetchPublicCategories,
  fetchPublicProducts,
  storefrontSettings,
} from "@/src/lib/storefront/data";
export const dynamic = "force-dynamic";
export const metadata = {
  title: `Shop — ${storefrontSettings.name}`,
  description: "A considered edit of pieces designed for everyday life.",
};
export default async function ShopPage() {
  const [{ products }, categories] = await Promise.all([
    fetchPublicProducts({ limit: "48" }),
    fetchPublicCategories(),
  ]);
  return (
    <main>
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pb-16 pt-20 md:px-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          The collection
        </p>
        <h1 className="max-w-2xl text-5xl tracking-tight md:text-7xl">
          Useful things, beautifully made.
        </h1>
        <p className="max-w-md text-base leading-7 text-muted-foreground">
          Clothing, accessories, and everyday objects designed to stay with you.
        </p>
      </section>
      <section className="mx-auto max-w-7xl px-5 md:px-10">
        <CategoryStrip categories={categories} />
      </section>
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-24 md:px-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              The edit
            </p>
            <h2 className="mt-3 text-3xl tracking-tight">
              Considered essentials
            </h2>
          </div>
          <Link
            href="/categories/new-arrivals"
            className="text-sm underline underline-offset-4"
          >
            View new arrivals
          </Link>
        </div>
        <ProductGrid products={products} />
      </section>
      <section className="mx-auto max-w-7xl px-5 md:px-10">
        <Benefits />
      </section>
      <Newsletter />
    </main>
  );
}
