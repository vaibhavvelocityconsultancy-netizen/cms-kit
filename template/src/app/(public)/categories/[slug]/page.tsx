import { notFound } from "next/navigation";
import {
  Breadcrumbs,
  ProductGrid,
} from "@/src/components/storefront/Storefront";
import {
  fetchPublicCategories,
  fetchPublicProducts,
  storefrontSettings,
} from "@/src/lib/storefront/data";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = (await fetchPublicCategories()).find(
    (item) => item.slug === slug,
  );
  return category
    ? {
        title: `${category.name} — ${storefrontSettings.name}`,
        description: category.description,
      }
    : {};
}
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [categories, result] = await Promise.all([
    fetchPublicCategories(),
    fetchPublicProducts({ categorySlug: slug, limit: "48" }),
  ]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  return (
    <main className="mx-auto max-w-7xl px-5 py-12 md:px-10">
      <Breadcrumbs
        items={[{ label: "Shop", href: "/shop" }, { label: category.name }]}
      />
      <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr] md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Collection
          </p>
          <h1 className="mt-3 text-5xl tracking-tight">{category.name}</h1>
        </div>
        <p className="max-w-md pb-1 text-sm leading-7 text-muted-foreground">
          {category.description}
        </p>
      </div>
      <div className="mt-16">
        <ProductGrid products={result.products} />
      </div>
    </main>
  );
}
