import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import { normalizeSlug } from "../../utils/slug.js";
import type {
  CategoryCreateInput,
  CategoryListQuery,
  CategoryUpdateInput,
} from "./category.schema.js";

function categorySlug(slug: string | undefined, name: string): string {
  const normalized = normalizeSlug(slug ?? name);
  if (!normalized) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Slug is invalid" });
  }
  return normalized;
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<void> {
  const existing = await prisma.category.findFirst({
    where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) {
    throw new AppError({
      statusCode: 409,
      code: "SLUG_ALREADY_EXISTS",
      message: "Category slug already exists",
    });
  }
}

export async function listPublicCategories() {
  return prisma.category.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      sortOrder: true,
      _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } },
    },
  });
}

export async function getPublicCategory(slug: string) {
  const category = await prisma.category.findFirst({
    where: { slug: normalizeSlug(slug), isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      sortOrder: true,
      _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } },
    },
  });
  if (!category) {
    throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Category not found" });
  }
  return category;
}

export async function listAdminCategories(query: CategoryListQuery) {
  const where = {
    deletedAt: null,
    ...(query.q ? { name: { contains: query.q } } : {}),
    ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
  };
  const [items, totalItems] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { _count: { select: { products: true } } },
    }),
    prisma.category.count({ where }),
  ]);
  return { items, pagination: paginationMeta(query.page, query.limit, totalItems) };
}

export async function createCategory(input: CategoryCreateInput) {
  const slug = categorySlug(input.slug, input.name);
  await ensureUniqueSlug(slug);
  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  const current = await prisma.category.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!current) {
    throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Category not found" });
  }
  const slug = categorySlug(input.slug, input.name);
  await ensureUniqueSlug(slug, id);
  return prisma.category.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: input.description,
      imageUrl: input.imageUrl ?? null,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const category = await transaction.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, _count: { select: { products: { where: { deletedAt: null } } } } },
    });
    if (!category) {
      throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Category not found" });
    }
    if (category._count.products > 0) {
      throw new AppError({
        statusCode: 409,
        code: "RESOURCE_IN_USE",
        message: "Category cannot be deleted while it has products",
      });
    }
    await transaction.category.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  });
}
