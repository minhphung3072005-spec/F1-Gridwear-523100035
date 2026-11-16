import { prisma } from "../../config/prisma.js";
import { ProductStatus, ReviewStatus } from "../../generated/prisma/enums.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import { normalizeSlug } from "../../utils/slug.js";
import type {
  AdminProductListQuery,
  ProductCreateInput,
  ProductListQuery,
  ProductStatusInput,
  ProductUpdateInput,
} from "./product.schema.js";

const listInclude = {
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    select: { id: true, urlSnapshot: true, altText: true, isPrimary: true, sortOrder: true },
  },
  variants: {
    where: { isActive: true, deletedAt: null },
    select: { id: true, price: true, salePrice: true, stock: true },
  },
  reviews: {
    where: { status: ReviewStatus.APPROVED, deletedAt: null },
    select: { rating: true },
  },
  _count: { select: { orderItems: true } },
} satisfies Prisma.ProductInclude;

type ProductListRecord = Prisma.ProductGetPayload<{ include: typeof listInclude }>;

function effectivePrice(basePrice: number, salePrice: number | null): number {
  return salePrice ?? basePrice;
}

function mapListProduct(product: ProductListRecord) {
  const basePrice = product.basePrice.toNumber();
  const salePrice = product.salePrice?.toNumber() ?? null;
  const variantPrices = product.variants.map((variant) =>
    effectivePrice(variant.price?.toNumber() ?? basePrice, variant.salePrice?.toNumber() ?? salePrice),
  );
  const ratingCount = product.reviews.length;
  const averageRating = ratingCount
    ? Number((product.reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount).toFixed(2))
    : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    basePrice,
    salePrice,
    effectivePrice: effectivePrice(basePrice, salePrice),
    minVariantPrice: variantPrices.length ? Math.min(...variantPrices) : null,
    maxVariantPrice: variantPrices.length ? Math.max(...variantPrices) : null,
    status: product.status,
    isFeatured: product.isFeatured,
    publishedAt: product.publishedAt,
    createdAt: product.createdAt,
    category: product.category,
    brand: product.brand,
    primaryImage: product.images[0] ?? null,
    imageCount: product.images.length,
    totalStock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
    variantCount: product.variants.length,
    averageRating,
    ratingCount,
    soldCount: product._count.orderItems,
  };
}

function priceCondition(query: ProductListQuery): Prisma.ProductWhereInput[] {
  if (query.minPrice === undefined && query.maxPrice === undefined) return [];
  const filter: Prisma.DecimalFilter = {
    ...(query.minPrice === undefined ? {} : { gte: query.minPrice }),
    ...(query.maxPrice === undefined ? {} : { lte: query.maxPrice }),
  };
  return [
    {
      OR: [
        { salePrice: { not: null, ...filter } },
        { salePrice: null, basePrice: filter },
      ],
    },
  ];
}

function productWhere(query: ProductListQuery, publicOnly: boolean): Prisma.ProductWhereInput {
  const variantFilters: Prisma.ProductVariantWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(query.sizes?.length ? { size: { slug: { in: query.sizes }, isActive: true } } : {}),
    ...(query.colors?.length ? { color: { slug: { in: query.colors }, isActive: true } } : {}),
  };
  const and: Prisma.ProductWhereInput[] = priceCondition(query);

  if (query.sizes?.length || query.colors?.length) {
    and.push({ variants: { some: variantFilters } });
  }
  if (query.inStock === true) {
    and.push({ variants: { some: { ...variantFilters, stock: { gt: 0 } } } });
  } else if (query.inStock === false) {
    and.push({ variants: { none: { isActive: true, deletedAt: null, stock: { gt: 0 } } } });
  }

  return {
    deletedAt: null,
    ...(publicOnly ? { status: ProductStatus.ACTIVE } : {}),
    ...(query.featured === undefined ? {} : { isFeatured: query.featured }),
    ...(query.brand?.length ? { brand: { slug: { in: query.brand }, deletedAt: null } } : {}),
    ...(query.category?.length
      ? { category: { slug: { in: query.category }, deletedAt: null } }
      : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { brand: { name: { contains: query.q } } },
            { category: { name: { contains: query.q } } },
            { variants: { some: { sku: { contains: query.q } } } },
          ],
        }
      : {}),
    ...(and.length ? { AND: and } : {}),
  };
}

function productOrderBy(query: ProductListQuery): Prisma.ProductOrderByWithRelationInput[] {
  switch (query.sortBy) {
    case "price":
      return [{ basePrice: query.sortOrder }, { createdAt: "desc" }];
    case "name":
      return [{ name: query.sortOrder }, { createdAt: "desc" }];
    case "popular":
      return [{ orderItems: { _count: query.sortOrder } }, { createdAt: "desc" }];
    case "rating":
      return [{ createdAt: "desc" }];
    case "newest":
      return [{ createdAt: query.sortOrder }];
  }
}

async function listProducts(query: ProductListQuery, publicOnly: boolean) {
  const where = productWhere(query, publicOnly);
  const totalItems = await prisma.product.count({ where });
  const ratingSort = query.sortBy === "rating";
  const records = await prisma.product.findMany({
    where,
    orderBy: productOrderBy(query),
    ...(ratingSort ? {} : { skip: (query.page - 1) * query.limit, take: query.limit }),
    include: listInclude,
  });
  let items = records.map(mapListProduct);

  if (ratingSort) {
    const direction = query.sortOrder === "asc" ? 1 : -1;
    items.sort((left, right) =>
      left.averageRating === right.averageRating
        ? right.ratingCount - left.ratingCount
        : (left.averageRating - right.averageRating) * direction,
    );
    const start = (query.page - 1) * query.limit;
    items = items.slice(start, start + query.limit);
  }

  return { items, pagination: paginationMeta(query.page, query.limit, totalItems) };
}

export function listPublicProducts(query: ProductListQuery) {
  return listProducts(query, true);
}

export async function listFeaturedProducts(query: ProductListQuery) {
  return listProducts({ ...query, featured: true }, true);
}

export async function getPublicProduct(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug: normalizeSlug(slug), status: ProductStatus.ACTIVE, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      variants: {
        where: { isActive: true, deletedAt: null },
        orderBy: [{ color: { sortOrder: "asc" } }, { size: { sortOrder: "asc" } }],
        include: {
          size: { select: { id: true, name: true, slug: true, sortOrder: true } },
          color: { select: { id: true, name: true, slug: true, hexCode: true, sortOrder: true } },
        },
      },
      reviews: {
        where: { status: ReviewStatus.APPROVED, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          rating: true,
          title: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!product) {
    throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Product not found" });
  }

  const ratingAggregate = await prisma.review.aggregate({
    where: { productId: product.id, status: ReviewStatus.APPROVED, deletedAt: null },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return {
    ...product,
    basePrice: product.basePrice.toNumber(),
    salePrice: product.salePrice?.toNumber() ?? null,
    variants: product.variants.map((variant) => ({
      ...variant,
      price: variant.price?.toNumber() ?? null,
      salePrice: variant.salePrice?.toNumber() ?? null,
    })),
    ratingSummary: {
      average: Number((ratingAggregate._avg.rating ?? 0).toFixed(2)),
      count: ratingAggregate._count._all,
    },
  };
}

export async function getRelatedProducts(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug: normalizeSlug(slug), status: ProductStatus.ACTIVE, deletedAt: null },
    select: { id: true, categoryId: true, brandId: true },
  });
  if (!product) {
    throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Product not found" });
  }
  const records = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      status: ProductStatus.ACTIVE,
      deletedAt: null,
      OR: [{ categoryId: product.categoryId }, { brandId: product.brandId }],
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 8,
    include: listInclude,
  });
  return records.map(mapListProduct);
}

export async function listAdminProducts(query: AdminProductListQuery) {
  const where = {
    ...productWhere(query, false),
    ...(query.status ? { status: query.status } : {}),
  };
  const [records, totalItems] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: productOrderBy(query),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: listInclude,
    }),
    prisma.product.count({ where }),
  ]);
  return {
    items: records.map(mapListProduct),
    pagination: paginationMeta(query.page, query.limit, totalItems),
  };
}

export async function getAdminProduct(id: string) {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      brand: true,
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      variants: {
        where: { deletedAt: null },
        include: { size: true, color: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!product) {
    throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Product not found" });
  }
  return {
    ...product,
    basePrice: product.basePrice.toNumber(),
    salePrice: product.salePrice?.toNumber() ?? null,
    variants: product.variants.map((variant) => ({
      ...variant,
      price: variant.price?.toNumber() ?? null,
      salePrice: variant.salePrice?.toNumber() ?? null,
    })),
  };
}

async function ensureProductReferences(categoryId: string, brandId: string): Promise<void> {
  const [category, brand] = await Promise.all([
    prisma.category.findFirst({ where: { id: categoryId, isActive: true, deletedAt: null }, select: { id: true } }),
    prisma.brand.findFirst({ where: { id: brandId, isActive: true, deletedAt: null }, select: { id: true } }),
  ]);
  if (!category) {
    throw new AppError({ statusCode: 422, code: "CATEGORY_INVALID", message: "Category is not active or does not exist" });
  }
  if (!brand) {
    throw new AppError({ statusCode: 422, code: "BRAND_INVALID", message: "Brand is not active or does not exist" });
  }
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<void> {
  const existing = await prisma.product.findFirst({
    where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) {
    throw new AppError({ statusCode: 409, code: "SLUG_ALREADY_EXISTS", message: "Product slug already exists" });
  }
}

function productSlug(slug: string | undefined, name: string): string {
  const normalized = normalizeSlug(slug ?? name);
  if (!normalized) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Slug is invalid" });
  }
  return normalized;
}

async function assertPublishable(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      _count: {
        select: {
          images: true,
          variants: { where: { isActive: true, deletedAt: null } },
        },
      },
    },
  });
  if (!product || product._count.images === 0 || product._count.variants === 0) {
    throw new AppError({
      statusCode: 422,
      code: "PRODUCT_NOT_PUBLISHABLE",
      message: "An active product must have at least one image and one active variant",
    });
  }
}

export async function createProduct(input: ProductCreateInput) {
  if (input.status === ProductStatus.ACTIVE) {
    throw new AppError({
      statusCode: 422,
      code: "PRODUCT_NOT_PUBLISHABLE",
      message: "Create the product as draft, then add an image and active variant before publishing",
    });
  }
  await ensureProductReferences(input.categoryId, input.brandId);
  const slug = productSlug(input.slug, input.name);
  await ensureUniqueSlug(slug);
  return prisma.product.create({
    data: {
      categoryId: input.categoryId,
      brandId: input.brandId,
      name: input.name,
      slug,
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      basePrice: input.basePrice,
      salePrice: input.salePrice ?? null,
      status: input.status,
      isFeatured: input.isFeatured,
      publishedAt: null,
    },
  });
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  const current = await prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true, publishedAt: true } });
  if (!current) {
    throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Product not found" });
  }
  await ensureProductReferences(input.categoryId, input.brandId);
  const slug = productSlug(input.slug, input.name);
  await ensureUniqueSlug(slug, id);
  if (input.status === ProductStatus.ACTIVE) await assertPublishable(id);
  return prisma.product.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      brandId: input.brandId,
      name: input.name,
      slug,
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      basePrice: input.basePrice,
      salePrice: input.salePrice ?? null,
      status: input.status,
      isFeatured: input.isFeatured,
      publishedAt:
        input.status === ProductStatus.ACTIVE ? (current.publishedAt ?? new Date()) : current.publishedAt,
    },
  });
}

export async function updateProductStatus(id: string, input: ProductStatusInput) {
  const current = await prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true, publishedAt: true } });
  if (!current) {
    throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Product not found" });
  }
  if (input.status === ProductStatus.ACTIVE) await assertPublishable(id);
  return prisma.product.update({
    where: { id },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.isFeatured === undefined ? {} : { isFeatured: input.isFeatured }),
      ...(input.status === ProductStatus.ACTIVE && !current.publishedAt ? { publishedAt: new Date() } : {}),
    },
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const result = await prisma.product.updateMany({
    where: { id, deletedAt: null },
    data: { status: ProductStatus.INACTIVE, isFeatured: false, deletedAt: new Date() },
  });
  if (result.count === 0) {
    throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Product not found" });
  }
}
