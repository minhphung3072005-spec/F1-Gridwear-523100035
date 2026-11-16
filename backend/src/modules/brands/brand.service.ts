import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import { normalizeSlug } from "../../utils/slug.js";
import type { BrandCreateInput, BrandListQuery, BrandUpdateInput } from "./brand.schema.js";

function brandSlug(slug: string | undefined, name: string): string {
  const normalized = normalizeSlug(slug ?? name);
  if (!normalized) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Slug is invalid" });
  }
  return normalized;
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<void> {
  const existing = await prisma.brand.findFirst({
    where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) {
    throw new AppError({
      statusCode: 409,
      code: "SLUG_ALREADY_EXISTS",
      message: "Brand slug already exists",
    });
  }
}

export async function listPublicBrands() {
  return prisma.brand.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      description: true,
      sortOrder: true,
      _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } },
    },
  });
}

export async function getPublicBrand(slug: string) {
  const brand = await prisma.brand.findFirst({
    where: { slug: normalizeSlug(slug), isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      description: true,
      sortOrder: true,
      _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } },
    },
  });
  if (!brand) {
    throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Brand not found" });
  }
  return brand;
}

export async function listAdminBrands(query: BrandListQuery) {
  const where = {
    deletedAt: null,
    ...(query.q ? { name: { contains: query.q } } : {}),
    ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
  };
  const [items, totalItems] = await prisma.$transaction([
    prisma.brand.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { _count: { select: { products: true } } },
    }),
    prisma.brand.count({ where }),
  ]);
  return { items, pagination: paginationMeta(query.page, query.limit, totalItems) };
}

export async function createBrand(input: BrandCreateInput) {
  const slug = brandSlug(input.slug, input.name);
  await ensureUniqueSlug(slug);
  return prisma.brand.create({
    data: {
      name: input.name,
      slug,
      logoUrl: input.logoUrl ?? null,
      description: input.description ?? null,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updateBrand(id: string, input: BrandUpdateInput) {
  const current = await prisma.brand.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!current) {
    throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Brand not found" });
  }
  const slug = brandSlug(input.slug, input.name);
  await ensureUniqueSlug(slug, id);
  return prisma.brand.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      logoUrl: input.logoUrl ?? null,
      description: input.description,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function deleteBrand(id: string): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const brand = await transaction.brand.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, _count: { select: { products: { where: { deletedAt: null } } } } },
    });
    if (!brand) {
      throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Brand not found" });
    }
    if (brand._count.products > 0) {
      throw new AppError({
        statusCode: 409,
        code: "RESOURCE_IN_USE",
        message: "Brand cannot be deleted while it has products",
      });
    }
    await transaction.brand.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  });
}
