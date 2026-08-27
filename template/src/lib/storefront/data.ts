import { getApiUrl } from "@/src/lib/config";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  description: string;
  details: string[];
  image: string;
  gallery: string[];
  colors: string[];
  sizes: string[];
  badge?: string;
  featured?: boolean;
};
export type CartLine = {
  itemId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  size?: string;
  color?: string;
  product?: Product;
};
export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
};

type PublicProduct = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number | string;
  isFeatured?: boolean;
  categories?: { name: string; slug: string }[];
  images?: { url: string; altText?: string | null }[];
};

function publicApiUrl(path: string) {
  return getApiUrl(path);
}

function toProduct(product: PublicProduct): Product {
  const category = product.categories?.[0];
  const gallery =
    product.images?.map((image) => image.url).filter(Boolean) ?? [];
  return {
    id: product.id,
    slug: product.slug,
    name: product.title,
    category: category?.name ?? "Shop",
    categorySlug: category?.slug ?? "all",
    price: Number(product.price),
    description: product.description || product.shortDescription || "",
    details: [],
    image: gallery[0] ?? "/placeholder-product.svg",
    gallery: gallery.length ? gallery : ["/placeholder-product.svg"],
    colors: [],
    sizes: [],
    badge: product.isFeatured ? "Featured" : undefined,
    featured: product.isFeatured,
  };
}

async function publicApi<T>(path: string): Promise<T> {
  const response = await fetch(publicApiUrl(path), { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body.message || "Unable to load storefront data");
  }
  return body.data as T;
}

export async function fetchPublicProducts(query: Record<string, string> = {}) {
  const params = new URLSearchParams(query);
  const result = await publicApi<{
    products: PublicProduct[];
    pagination: unknown;
  }>(`/api/public/ecommerce/products?${params}`);
  return {
    products: result.products.map(toProduct),
    pagination: result.pagination,
  };
}

export async function fetchPublicProduct(slug: string) {
  try {
    const product = await publicApi<PublicProduct>(
      `/api/public/ecommerce/products/${encodeURIComponent(slug)}`,
    );
    return toProduct(product);
  } catch {
    return null;
  }
}

export async function fetchPublicCategories() {
  const result = await publicApi<{ categories: StorefrontCategory[] }>(
    "/api/public/ecommerce/category",
  );
  return result.categories.map((category) => ({
    ...category,
    description: category.description ?? "",
    image: category.image ?? "/placeholder-product.svg",
  }));
}

export async function fetchPublicCategory(slug: string) {
  const categories = await fetchPublicCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}
const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;
export const categories = [
  {
    name: "New arrivals",
    slug: "new-arrivals",
    description: "The latest pieces, considered for now.",
    image: image("photo-1483985988355-763728e1935b"),
  },
  {
    name: "Everyday essentials",
    slug: "everyday-essentials",
    description: "Quietly confident staples for every day.",
    image: image("photo-1490481651871-ab68de25d43d"),
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "The finishing touches that make a look yours.",
    image: image("photo-1523779917675-b6ed3a42a561"),
  },
];
export const products: Product[] = [
  {
    id: "p1",
    slug: "the-soft-structure-blazer",
    name: "The Soft Structure Blazer",
    category: "Everyday essentials",
    categorySlug: "everyday-essentials",
    price: 189,
    description:
      "A relaxed, softly tailored blazer with a clean line and an easy drape. Made to be lived in.",
    details: [
      "Relaxed fit",
      "Unlined construction",
      "Recycled wool blend",
      "Dry clean only",
    ],
    image: image("photo-1551028719-00167b16eac5"),
    gallery: [
      image("photo-1551028719-00167b16eac5"),
      image("photo-1591369822096-ffd140ec948f"),
    ],
    colors: ["Ink", "Stone"],
    sizes: ["XS", "S", "M", "L", "XL"],
    badge: "Editor’s pick",
    featured: true,
  },
  {
    id: "p2",
    slug: "washed-cotton-shirt",
    name: "Washed Cotton Shirt",
    category: "New arrivals",
    categorySlug: "new-arrivals",
    price: 89,
    description:
      "A crisp everyday shirt softened through a careful wash. Roomy enough to move, neat enough to layer.",
    details: [
      "Oversized fit",
      "100% organic cotton",
      "Mother-of-pearl buttons",
      "Machine wash cold",
    ],
    image: image("photo-1603252110481-7ba873bf42ab"),
    gallery: [image("photo-1603252110481-7ba873bf42ab")],
    colors: ["White", "Blue"],
    sizes: ["XS", "S", "M", "L"],
    badge: "New",
    featured: true,
  },
  {
    id: "p3",
    slug: "everyday-leather-tote",
    name: "Everyday Leather Tote",
    category: "Accessories",
    categorySlug: "accessories",
    price: 145,
    description:
      "A generous leather tote with a considered interior and handles designed for the daily commute.",
    details: [
      "Vegetable-tanned leather",
      "Interior pocket",
      "Magnetic closure",
      "Fits a 16-inch laptop",
    ],
    image: image("photo-1548036328-c9fa89d128fa"),
    gallery: [image("photo-1548036328-c9fa89d128fa")],
    colors: ["Cognac", "Black"],
    sizes: ["One size"],
    featured: true,
  },
  {
    id: "p4",
    slug: "fine-rib-knit",
    name: "Fine Rib Knit",
    category: "Everyday essentials",
    categorySlug: "everyday-essentials",
    price: 110,
    description:
      "A close-fitting rib knit with a soft hand feel and enough stretch for long days.",
    details: ["Slim fit", "Merino wool blend", "Ribbed finish", "Hand wash"],
    image: image("photo-1576566588028-4147f3842f27"),
    gallery: [image("photo-1576566588028-4147f3842f27")],
    colors: ["Oat", "Charcoal"],
    sizes: ["XS", "S", "M", "L"],
    featured: true,
  },
  {
    id: "p5",
    slug: "daily-canvas-trouser",
    name: "Daily Canvas Trouser",
    category: "New arrivals",
    categorySlug: "new-arrivals",
    price: 120,
    description:
      "A wide-leg trouser in sturdy cotton canvas, finished with a high waist and considered pockets.",
    details: [
      "High waist",
      "Wide leg",
      "Organic cotton canvas",
      "Machine wash cold",
    ],
    image: image("photo-1506629905607-d9c297d4f6e5"),
    gallery: [image("photo-1506629905607-d9c297d4f6e5")],
    colors: ["Olive", "Ecru"],
    sizes: ["26", "28", "30", "32", "34"],
    badge: "New",
  },
  {
    id: "p6",
    slug: "sculptural-sunglasses",
    name: "Sculptural Sunglasses",
    category: "Accessories",
    categorySlug: "accessories",
    price: 95,
    description:
      "A bold, lightweight frame with tinted lenses and a distinctly modern silhouette.",
    details: ["Acetate frame", "UV400 lenses", "Protective case included"],
    image: image("photo-1511499767150-a48a237f0083"),
    gallery: [image("photo-1511499767150-a48a237f0083")],
    colors: ["Tortoise", "Black"],
    sizes: ["One size"],
  },
];
export const storefrontSettings = {
  name: "FORM / FIELD",
  tagline: "Useful things, beautifully made.",
};
export const homepageCopy = {
  eyebrow: "The considered edit",
  title: "Objects for a life well lived.",
  body: "A small collection of clothing, accessories, and everyday pieces designed to stay with you.",
  heroImage: image("photo-1490481651871-ab68de25d43d"),
};
export const benefits = [
  {
    title: "Thoughtfully sourced",
    body: "Materials and makers chosen with care.",
  },
  { title: "Free shipping", body: "On orders over $150, always." },
  { title: "Easy returns", body: "30 days to decide, no questions asked." },
];
export const accountOrders = [
  {
    id: "FF-10482",
    date: "June 14, 2026",
    status: "Delivered",
    total: 234,
    items: ["Washed Cotton Shirt", "Sculptural Sunglasses"],
  },
  {
    id: "FF-10391",
    date: "May 28, 2026",
    status: "In transit",
    total: 189,
    items: ["The Soft Structure Blazer"],
  },
];
export const testimonials = [
  {
    quote:
      "Everything feels intentional, from the packaging to the pieces themselves.",
    author: "Maya R.",
  },
  {
    quote:
      "The kind of shop you come back to because every item earns its place.",
    author: "Oliver T.",
  },
];
export const getProduct = (slug: string) =>
  products.find((p) => p.slug === slug);
export const getProductById = (id: string) => products.find((p) => p.id === id);
export const getCategory = (slug: string) =>
  categories.find((c) => c.slug === slug);
export const getProductsByCategory = (slug: string) =>
  products.filter(
    (p) =>
      p.categorySlug === slug || (slug === "new-arrivals" && p.badge === "New"),
  );
export const relatedProducts = (product: Product) =>
  products
    .filter(
      (p) => p.id !== product.id && p.categorySlug === product.categorySlug,
    )
    .slice(0, 3);
export const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
export const getCartTotal = (lines: CartLine[]) =>
  lines.reduce(
    (sum, line) =>
      sum +
      (line.product?.price ?? getProductById(line.productId)?.price ?? 0) *
        line.quantity,
    0,
  );
export const getCartCount = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + line.quantity, 0);
export const getCartKey = (line: CartLine) =>
  `${line.productId}:${line.size ?? ""}:${line.color ?? ""}`;
export const findCartLine = (lines: CartLine[], next: CartLine) =>
  lines.findIndex((line) => getCartKey(line) === getCartKey(next));
export const normalizeCart = (lines: CartLine[]) =>
  lines
    .filter(
      (line) =>
        (line.product || getProductById(line.productId)) && line.quantity > 0,
    )
    .map((line) => ({
      ...line,
      quantity: Math.min(10, Math.floor(line.quantity)),
    }));
export const accountUrl = "/account";
export const footerLinks = [
  { label: "Shipping & returns", href: "/search?q=shipping" },
  { label: "Contact", href: "/search?q=contact" },
  { label: "Account", href: "/account" },
];
