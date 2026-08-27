import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AddToCart,
  Breadcrumbs,
  ProductGrid,
} from "@/src/components/storefront/Storefront";
import {
  fetchPublicProduct,
  fetchPublicProducts,
  formatMoney,
  storefrontSettings,
} from "@/src/lib/storefront/data";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = await fetchPublicProduct((await params).slug);
  return product
    ? {
        title: `${product.name} — ${storefrontSettings.name}`,
        description: product.description,
        openGraph: { images: [product.image] },
      }
    : {};
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchPublicProduct(slug);
  if (!product) notFound();
  const related =
    product.categorySlug === "all"
      ? []
      : (
          await fetchPublicProducts({
            categorySlug: product.categorySlug,
            limit: "4",
          })
        ).products
          .filter((item) => item.id !== product.id)
          .slice(0, 3);
  return (
    <main className="mx-auto max-w-7xl px-5 py-12 md:px-10">
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/shop" },
          {
            label: product.category,
            href: `/categories/${product.categorySlug}`,
          },
          { label: product.name },
        ]}
      />
      <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
        <div className="grid gap-3 sm:grid-cols-2">
          {product.gallery.map((image) => (
            <div key={image} className="aspect-[4/5] overflow-hidden bg-muted">
              <img
                src={image}
                alt={product.name}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-7 md:pt-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {product.category}
            </p>
            <h1 className="mt-3 text-4xl tracking-tight md:text-5xl">
              {product.name}
            </h1>
            <p className="mt-4 text-lg">{formatMoney(product.price)}</p>
          </div>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            {product.description}
          </p>
          <div className="flex flex-col gap-3 border-y border-border py-5 text-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Details
            </p>
            {product.details.length ? (
              product.details.map((detail) => <p key={detail}>{detail}</p>)
            ) : (
              <p className="text-muted-foreground">Made for everyday use.</p>
            )}
          </div>
          <AddToCart
            product={product}
            size={product.sizes[0]}
            color={product.colors[0]}
          />
          <p className="text-xs text-muted-foreground">
            Ships within 2–4 business days. Free returns within 30 days.
          </p>
        </div>
      </div>
      <section className="mt-28 border-t border-border pt-12">
        <h2 className="mb-8 text-2xl tracking-tight">You may also like</h2>
        <ProductGrid products={related} />
      </section>
    </main>
  );
}
