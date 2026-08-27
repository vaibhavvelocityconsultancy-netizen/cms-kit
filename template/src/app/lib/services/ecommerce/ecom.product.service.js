import { prisma } from "../../prisma";
import { requireAuth, requirePermission } from "../../withPermission";

function slugify(str) {
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateUniqueSlug(tenantId, value, excludeId = null) {
  const base = slugify(value) || "product";
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        tenantId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
}

// List

export async function getProducts(query = {}) {
  await requirePermission("products_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const { search, status, brandId, categoryId, page = 1, limit = 20 } = query;

  const where = { tenantId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status;
  if (brandId) where.brandId = brandId;
  if (categoryId) {
    where.categories = { some: { id: categoryId } };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

// create product

export async function createProduct(input) {
  await requirePermission("products_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const {
    title,
    slug: inputSlug,
    description,
    shortDescription,
    sku,
    price,
    compareAtPrice,
    stockQuantity,
    inStock,
    status,
    isFeatured,
    isVariable,
    seoData,
    brandId,
    categoryIds = [],
    images = [],
  } = input;

  if (!title || Number(price) < 0) {
    throw new Error("Title and a valid price are required");
  }

  const slug = await generateUniqueSlug(tenantId, inputSlug || title);

  const product = await prisma.product.create({
    data: {
      tenantId,
      title,
      description,
      shortDescription,
      sku,
      price,
      compareAtPrice,
      stockQuantity,
      inStock,
      status,
      isFeatured,
      isVariable,
      slug,
      seoData,
      brandId,
      categories: categoryIds.length
        ? { connect: categoryIds.map((id) => ({ id })) }
        : undefined,
      images: images.length
        ? {
            create: images.map((img, idx) => ({
              url: img.url,
              altText: img.altText ?? null,
              sortOrder: img.sortOrder ?? idx,
            })),
          }
        : undefined,
    },
    include: {
      brand: true,
      categories: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
    },
  });

  return product;
}

// get one product

export async function getProductById(productId) {
  await requirePermission("products_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    include: {
      brand: true,
      categories: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        include: {
          attributeValues: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}

// ─────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────

export async function updateProduct(id, input) {
  await requirePermission("products_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existing = await prisma.product.findFirst({
    where: { id, tenantId },
  });

  if (!existing) throw new Error("Product not found");

  const {
    title,
    slug: inputSlug,
    description,
    shortDescription,
    sku,
    price,
    compareAtPrice,
    stockQuantity,
    inStock,
    status,
    isFeatured,
    isVariable,
    seoData,
    brandId,
    categoryIds,
    images,
  } = input;

  const normalizedStatus =
    typeof status === "string" ? status.trim().toUpperCase() : status;
  if (
    normalizedStatus !== undefined &&
    !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(normalizedStatus)
  ) {
    throw new Error("Invalid product status");
  }

  let slug = existing.slug;
  if (inputSlug && slugify(inputSlug) !== existing.slug) {
    slug = await generateUniqueSlug(tenantId, inputSlug, id);
  } else if (title && title !== existing.title) {
    slug = await generateUniqueSlug(tenantId, title, id);
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      title: title ?? undefined,
      slug,
      description: description ?? undefined,
      shortDescription: shortDescription ?? undefined,
      sku: sku ?? undefined,
      price: price ?? undefined,
      compareAtPrice: compareAtPrice ?? undefined,
      stockQuantity: stockQuantity ?? undefined,
      inStock: inStock ?? undefined,
      status: normalizedStatus ?? undefined,
      isFeatured: isFeatured ?? undefined,
      isVariable: isVariable ?? undefined,
      seoData: seoData ?? undefined,
      brandId: brandId === undefined ? undefined : brandId,
      categories:
        categoryIds !== undefined
          ? { set: categoryIds.map((cid) => ({ id: cid })) }
          : undefined,
    },
    include: {
      brand: true,
      categories: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  // images replaced wholesale if provided
  if (images !== undefined) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    if (images.length) {
      await prisma.productImage.createMany({
        data: images.map((img, idx) => ({
          productId: id,
          url: img.url,
          altText: img.altText ?? null,
          sortOrder: img.sortOrder ?? idx,
        })),
      });
    }
  }

  if (images === undefined) {
    return product;
  }

  return prisma.product.findFirst({
    where: { id, tenantId },
    include: {
      brand: true,
      categories: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
    },
  });
}

// ─────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────

export async function deleteProduct(id) {
  await requirePermission("products_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existing = await prisma.product.findFirst({
    where: { id, tenantId },
  });

  if (!existing) throw new Error("Product not found");

  await prisma.product.delete({ where: { id } });

  return { id };
}
