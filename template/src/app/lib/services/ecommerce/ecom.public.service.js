import { prisma } from "../../prisma.js";

function resolveTenantId(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

async function getTenantId(value) {
  const requested = resolveTenantId(value);
  if (requested !== undefined) return requested;
  const tenant = await prisma.tenant.findFirst({ select: { id: true }, orderBy: { id: "asc" } });
  return tenant?.id;
}

const storefrontProductSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  shortDescription: true,
  price: true,
  compareAtPrice: true,
  inStock: true,
  stockQuantity: true,
  isFeatured: true,
  isVariable: true,
  brand: { select: { id: true, name: true } },
  categories: { select: { id: true, name: true, slug: true, description: true, image: true } },
  images: { orderBy: { sortOrder: "asc" }, select: { url: true, altText: true, sortOrder: true } },
  variants: { select: { id: true, price: true, stockQuantity: true, inStock: true } },
};

function sanitizeProduct(product) {
  return {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice === null ? null : Number(product.compareAtPrice),
    categories: product.categories ?? [],
    images: product.images ?? [],
    variants: product.variants ?? [],
  };
}

export async function getPublicProducts(query = {}) {
  const tenantId = await getTenantId(query.tenantId);
  if (!tenantId) return { products: [], pagination: { total: 0, page: 1, limit: 24, totalPages: 0 } };

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(query.limit) || 24));
  const where = { tenantId, status: "PUBLISHED" };
  if (query.search) where.OR = [
    { title: { contains: query.search, mode: "insensitive" } },
    { description: { contains: query.search, mode: "insensitive" } },
  ];
  if (query.categoryId) where.categories = { some: { id: query.categoryId } };
  if (query.categorySlug) where.categories = { some: { slug: query.categorySlug } };
  if (query.featured === "true") where.isFeatured = true;

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, select: storefrontProductSelect, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], skip: (page - 1) * limit, take: limit }),
    prisma.product.count({ where }),
  ]);
  return { products: products.map(sanitizeProduct), pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getPublicProductBySlug(slug, tenantValue) {
  const tenantId = await getTenantId(tenantValue);
  if (!tenantId) return null;
  const product = await prisma.product.findFirst({ where: { tenantId, slug, status: "PUBLISHED" }, select: storefrontProductSelect });
  return product ? sanitizeProduct(product) : null;
}

export async function getPublicCategories(tenantValue) {
  const tenantId = await getTenantId(tenantValue);
  if (!tenantId) return [];
  return prisma.productCategory.findMany({
    where: { tenantId },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, description: true, image: true, parentId: true, _count: { select: { products: true } } },
  });
}

export async function getPublicCategoryBySlug(slug, tenantValue) {
  const tenantId = await getTenantId(tenantValue);
  if (!tenantId) return null;
  const category = await prisma.productCategory.findFirst({ where: { tenantId, slug }, select: { id: true, name: true, slug: true, description: true, image: true, parentId: true } });
  if (!category) return null;
  const products = await prisma.product.findMany({ where: { tenantId, status: "PUBLISHED", categories: { some: { id: category.id } } }, select: storefrontProductSelect, orderBy: { createdAt: "desc" } });
  return { ...category, products: products.map(sanitizeProduct) };
}

export async function getPublicProductById(id, tenantValue) {
  const tenantId = await getTenantId(tenantValue);
  if (!tenantId) return null;
  const product = await prisma.product.findFirst({ where: { tenantId, id, status: "PUBLISHED" }, select: storefrontProductSelect });
  return product ? sanitizeProduct(product) : null;
}
