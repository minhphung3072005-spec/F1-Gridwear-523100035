import { prisma } from "../../config/prisma.js";
import { ProductStatus } from "../../generated/prisma/enums.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import { normalizeSlug } from "../../utils/slug.js";
import type {
  ColorCreateInput,
  ColorUpdateInput,
  SizeCreateInput,
  SizeUpdateInput,
  VariantBulkCreateInput,
  VariantCreateInput,
  VariantUpdateInput,
} from "./variant.schema.js";

const variantInclude = {
  size: true,
  color: true,
  product: { select: { id: true, name: true, slug: true, status: true, basePrice: true } },
} satisfies Prisma.ProductVariantInclude;

type VariantRecord = Prisma.ProductVariantGetPayload<{ include: typeof variantInclude }>;

function mapVariant(variant: VariantRecord) {
  return {
    ...variant,
    price: variant.price?.toNumber() ?? null,
    salePrice: variant.salePrice?.toNumber() ?? null,
    product: { ...variant.product, basePrice: variant.product.basePrice.toNumber() },
  };
}

function requiredSlug(value: string | undefined, name: string): string {
  const slug = normalizeSlug(value ?? name);
  if (!slug) {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Slug is invalid" });
  }
  return slug;
}

async function ensureSizeUnique(name: string, slug: string, excludeId?: string) {
  const duplicate = await prisma.size.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [{ name }, { slug }],
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError({ statusCode: 409, code: "ATTRIBUTE_ALREADY_EXISTS", message: "Size name or slug already exists" });
  }
}

async function ensureColorUnique(name: string, slug: string, excludeId?: string) {
  const duplicate = await prisma.color.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [{ name }, { slug }],
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError({ statusCode: 409, code: "ATTRIBUTE_ALREADY_EXISTS", message: "Color name or slug already exists" });
  }
}

export function listPublicSizes() {
  return prisma.size.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export function listPublicColors() {
  return prisma.color.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export function listAdminSizes() {
  return prisma.size.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { variants: true } } },
  });
}

export function listAdminColors() {
  return prisma.color.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { variants: true } } },
  });
}

export async function createSize(input: SizeCreateInput) {
  const slug = requiredSlug(input.slug, input.name);
  await ensureSizeUnique(input.name, slug);
  return prisma.size.create({ data: { ...input, slug } });
}

export async function updateSize(id: string, input: SizeUpdateInput) {
  const current = await prisma.size.findUnique({ where: { id }, select: { id: true } });
  if (!current) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Size not found" });
  const slug = requiredSlug(input.slug, input.name);
  await ensureSizeUnique(input.name, slug, id);
  return prisma.size.update({ where: { id }, data: { ...input, slug } });
}

export async function deactivateSize(id: string): Promise<void> {
  const result = await prisma.size.updateMany({ where: { id }, data: { isActive: false } });
  if (result.count === 0) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Size not found" });
}

export async function createColor(input: ColorCreateInput) {
  const slug = requiredSlug(input.slug, input.name);
  await ensureColorUnique(input.name, slug);
  return prisma.color.create({
    data: { ...input, slug, hexCode: input.hexCode ?? null },
  });
}

export async function updateColor(id: string, input: ColorUpdateInput) {
  const current = await prisma.color.findUnique({ where: { id }, select: { id: true } });
  if (!current) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Color not found" });
  const slug = requiredSlug(input.slug, input.name);
  await ensureColorUnique(input.name, slug, id);
  return prisma.color.update({ where: { id }, data: { ...input, slug } });
}

export async function deactivateColor(id: string): Promise<void> {
  const result = await prisma.color.updateMany({ where: { id }, data: { isActive: false } });
  if (result.count === 0) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Color not found" });
}

async function getProductForVariant(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true, status: true, basePrice: true },
  });
  if (!product) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Product not found" });
  return product;
}

async function validateVariantReferences(sizeId: string, colorId: string): Promise<void> {
  const [size, color] = await Promise.all([
    prisma.size.findFirst({ where: { id: sizeId, isActive: true }, select: { id: true } }),
    prisma.color.findFirst({ where: { id: colorId, isActive: true }, select: { id: true } }),
  ]);
  if (!size) throw new AppError({ statusCode: 422, code: "SIZE_INVALID", message: "Size is not active or does not exist" });
  if (!color) throw new AppError({ statusCode: 422, code: "COLOR_INVALID", message: "Color is not active or does not exist" });
}

function validateEffectiveSalePrice(
  productBasePrice: number,
  input: { price?: number | null | undefined; salePrice?: number | null | undefined },
): void {
  const salePrice = input.salePrice;
  if (salePrice !== undefined && salePrice !== null && salePrice >= (input.price ?? productBasePrice)) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_VARIANT_PRICE",
      message: "Variant sale price must be less than its effective regular price",
    });
  }
}

async function ensureVariantUnique(
  productId: string,
  input: { sizeId: string; colorId: string; sku: string },
  excludeId?: string,
): Promise<void> {
  const duplicate = await prisma.productVariant.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [
        { sku: input.sku },
        { productId, sizeId: input.sizeId, colorId: input.colorId },
      ],
    },
    select: { id: true, sku: true },
  });
  if (duplicate) {
    throw new AppError({
      statusCode: 409,
      code: duplicate.sku === input.sku ? "SKU_ALREADY_EXISTS" : "VARIANT_ALREADY_EXISTS",
      message: duplicate.sku === input.sku ? "SKU already exists" : "Size and color combination already exists",
    });
  }
}

export async function listProductVariants(productId: string) {
  await getProductForVariant(productId);
  const variants = await prisma.productVariant.findMany({
    where: { productId, deletedAt: null },
    orderBy: [{ color: { sortOrder: "asc" } }, { size: { sortOrder: "asc" } }],
    include: variantInclude,
  });
  return variants.map(mapVariant);
}

export async function createVariant(productId: string, input: VariantCreateInput) {
  const product = await getProductForVariant(productId);
  await validateVariantReferences(input.sizeId, input.colorId);
  validateEffectiveSalePrice(product.basePrice.toNumber(), input);
  await ensureVariantUnique(productId, input);
  const variant = await prisma.productVariant.create({
    data: {
      productId,
      sizeId: input.sizeId,
      colorId: input.colorId,
      sku: input.sku,
      price: input.price ?? null,
      salePrice: input.salePrice ?? null,
      isActive: input.isActive,
      stock: 0,
    },
    include: variantInclude,
  });
  return mapVariant(variant);
}

export async function createVariantsBulk(productId: string, input: VariantBulkCreateInput) {
  const product = await getProductForVariant(productId);
  const sizeIds = [...new Set(input.items.map((item) => item.sizeId))];
  const colorIds = [...new Set(input.items.map((item) => item.colorId))];
  const [sizeCount, colorCount] = await Promise.all([
    prisma.size.count({ where: { id: { in: sizeIds }, isActive: true } }),
    prisma.color.count({ where: { id: { in: colorIds }, isActive: true } }),
  ]);
  if (sizeCount !== sizeIds.length) throw new AppError({ statusCode: 422, code: "SIZE_INVALID", message: "One or more sizes are invalid" });
  if (colorCount !== colorIds.length) throw new AppError({ statusCode: 422, code: "COLOR_INVALID", message: "One or more colors are invalid" });
  input.items.forEach((item) => validateEffectiveSalePrice(product.basePrice.toNumber(), item));

  const existing = await prisma.productVariant.findMany({
    where: {
      OR: [
        { sku: { in: input.items.map((item) => item.sku) } },
        {
          productId,
          OR: input.items.map((item) => ({ sizeId: item.sizeId, colorId: item.colorId })),
        },
      ],
    },
    select: { id: true },
  });
  if (existing.length) {
    throw new AppError({ statusCode: 409, code: "VARIANT_ALREADY_EXISTS", message: "A SKU or size/color combination already exists" });
  }

  await prisma.productVariant.createMany({
    data: input.items.map((item) => ({
      productId,
      sizeId: item.sizeId,
      colorId: item.colorId,
      sku: item.sku,
      price: item.price ?? null,
      salePrice: item.salePrice ?? null,
      isActive: item.isActive,
      stock: 0,
    })),
  });
  const variants = await prisma.productVariant.findMany({
    where: { sku: { in: input.items.map((item) => item.sku) } },
    include: variantInclude,
  });
  return variants.map(mapVariant);
}

async function assertCanDeactivate(productId: string, variantId: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { status: true } });
  if (product?.status !== ProductStatus.ACTIVE) return;
  const activeCount = await prisma.productVariant.count({
    where: { productId, id: { not: variantId }, isActive: true, deletedAt: null },
  });
  if (activeCount === 0) {
    throw new AppError({
      statusCode: 409,
      code: "LAST_ACTIVE_VARIANT",
      message: "An active product must keep at least one active variant",
    });
  }
}

export async function updateVariant(id: string, input: VariantUpdateInput) {
  const current = await prisma.productVariant.findFirst({
    where: { id, deletedAt: null },
    include: { product: { select: { id: true, basePrice: true } } },
  });
  if (!current) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Variant not found" });
  await validateVariantReferences(input.sizeId, input.colorId);
  validateEffectiveSalePrice(current.product.basePrice.toNumber(), input);
  await ensureVariantUnique(current.productId, input, id);
  if (current.isActive && !input.isActive) await assertCanDeactivate(current.productId, id);
  const variant = await prisma.productVariant.update({
    where: { id },
    data: {
      sizeId: input.sizeId,
      colorId: input.colorId,
      sku: input.sku,
      price: input.price,
      salePrice: input.salePrice,
      isActive: input.isActive,
    },
    include: variantInclude,
  });
  return mapVariant(variant);
}

export async function deactivateVariant(id: string): Promise<void> {
  const current = await prisma.productVariant.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, productId: true },
  });
  if (!current) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Variant not found" });
  await assertCanDeactivate(current.productId, id);
  await prisma.productVariant.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  });
}
