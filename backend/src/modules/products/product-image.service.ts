import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { ProductImageCreateInput } from "./product-image.schema.js";

async function ensureProduct(productId: string) { const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null }, select: { id: true } }); if (!product) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Product not found" }); }
export async function createProductImage(productId: string, input: ProductImageCreateInput) {
  await ensureProduct(productId);
  return prisma.$transaction(async (transaction) => {
    const last = await transaction.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    const count = await transaction.productImage.count({ where: { productId } }); const primary = input.isPrimary || count === 0;
    if (primary) await transaction.productImage.updateMany({ where: { productId, isPrimary: true }, data: { isPrimary: false } });
    return transaction.productImage.create({ data: { productId, urlSnapshot: input.url, altText: input.altText ?? null, isPrimary: primary, sortOrder: (last?.sortOrder ?? -1) + 1 } });
  });
}
export async function deleteProductImage(productId: string, imageId: string) {
  await prisma.$transaction(async (transaction) => {
    const image = await transaction.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Product image not found" });
    await transaction.productImage.delete({ where: { id: imageId } });
    if (image.isPrimary) { const next = await transaction.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "asc" }, select: { id: true } }); if (next) await transaction.productImage.update({ where: { id: next.id }, data: { isPrimary: true } }); }
  });
}
