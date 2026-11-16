import { randomUUID } from "node:crypto";

import { prisma } from "../../config/prisma.js";
import { InventoryTransactionType } from "../../generated/prisma/enums.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import type {
  InventoryAdjustmentInput,
  InventoryImportInput,
  InventoryListQuery,
  InventoryTransactionQuery,
} from "./inventory.schema.js";

export type StockStatus = "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";

export function stockStatus(stock: number): StockStatus {
  if (stock === 0) return "OUT_OF_STOCK";
  if (stock <= 5) return "LOW_STOCK";
  return "IN_STOCK";
}

function stockWhere(status: InventoryListQuery["status"]): Prisma.IntFilter | undefined {
  switch (status) {
    case "OUT_OF_STOCK":
      return { equals: 0 };
    case "LOW_STOCK":
      return { gte: 1, lte: 5 };
    case "IN_STOCK":
      return { gt: 5 };
    case undefined:
      return undefined;
  }
}

export async function listInventory(query: InventoryListQuery) {
  const stock = stockWhere(query.status);
  const productFilter: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(query.brand ? { brand: { slug: query.brand } } : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
  };
  const where: Prisma.ProductVariantWhereInput = {
    deletedAt: null,
    ...(stock ? { stock } : {}),
    product: productFilter,
    ...(query.q
      ? {
          OR: [
            { sku: { contains: query.q } },
            { product: { name: { contains: query.q } } },
          ],
        }
      : {}),
  };
  const [records, totalItems, outOfStock, lowStock] = await prisma.$transaction([
    prisma.productVariant.findMany({
      where,
      orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        size: true,
        color: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            brand: { select: { id: true, name: true, slug: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
    prisma.productVariant.count({ where }),
    prisma.productVariant.count({ where: { deletedAt: null, stock: 0 } }),
    prisma.productVariant.count({ where: { deletedAt: null, stock: { gte: 1, lte: 5 } } }),
  ]);
  return {
    items: records.map((variant) => ({
      ...variant,
      price: variant.price?.toNumber() ?? null,
      salePrice: variant.salePrice?.toNumber() ?? null,
      stockStatus: stockStatus(variant.stock),
    })),
    summary: { outOfStock, lowStock, inStock: await prisma.productVariant.count({ where: { deletedAt: null, stock: { gt: 5 } } }) },
    pagination: paginationMeta(query.page, query.limit, totalItems),
  };
}

export async function listInventoryTransactions(
  variantId: string,
  query: InventoryTransactionQuery,
) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, deletedAt: null },
    select: { id: true, sku: true, stock: true },
  });
  if (!variant) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Variant not found" });
  const where: Prisma.InventoryTransactionWhereInput = {
    variantId,
    ...(query.type ? { type: query.type } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };
  const [items, totalItems] = await prisma.$transaction([
    prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        order: { select: { id: true, orderCode: true } },
      },
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);
  return { variant, items, pagination: paginationMeta(query.page, query.limit, totalItems) };
}

export async function adjustInventory(
  variantId: string,
  input: InventoryAdjustmentInput,
  actorId: string,
) {
  return prisma.$transaction(async (transaction) => {
    const variant = await transaction.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
      select: { id: true, sku: true, stock: true },
    });
    if (!variant) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Variant not found" });

    const stockAfter =
      input.mode === "SET"
        ? input.quantity
        : input.mode === "INCREMENT"
          ? variant.stock + input.quantity
          : variant.stock - input.quantity;
    if (stockAfter < 0) {
      throw new AppError({
        statusCode: 409,
        code: "INSUFFICIENT_STOCK",
        message: "Inventory cannot be reduced below zero",
        errors: [{ field: "quantity", message: `Current stock is ${variant.stock}` }],
      });
    }
    const quantityDelta = stockAfter - variant.stock;
    if (quantityDelta === 0) {
      throw new AppError({ statusCode: 409, code: "STOCK_UNCHANGED", message: "The requested adjustment does not change stock" });
    }

    const updated = await transaction.productVariant.updateMany({
      where: { id: variant.id, stock: variant.stock, deletedAt: null },
      data: { stock: stockAfter },
    });
    if (updated.count !== 1) {
      throw new AppError({ statusCode: 409, code: "STOCK_CONFLICT", message: "Stock changed concurrently; retry the request" });
    }
    const inventoryTransaction = await transaction.inventoryTransaction.create({
      data: {
        variantId: variant.id,
        createdById: actorId,
        type: InventoryTransactionType.MANUAL_ADJUSTMENT,
        quantityDelta,
        stockBefore: variant.stock,
        stockAfter,
        reason: input.reason,
      },
    });
    return { variant: { id: variant.id, sku: variant.sku, stock: stockAfter, stockStatus: stockStatus(stockAfter) }, inventoryTransaction };
  });
}

export async function importInventory(input: InventoryImportInput, actorId: string) {
  const reference = input.reference ?? `IMP-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${randomUUID().slice(0, 8)}`;
  const sortedItems = [...input.items].sort((left, right) => left.variantId.localeCompare(right.variantId));

  const result = await prisma.$transaction(async (transaction) => {
    const transactions = [];
    for (const item of sortedItems) {
      const variant = await transaction.productVariant.findFirst({
        where: { id: item.variantId, deletedAt: null },
        select: { id: true, sku: true, stock: true },
      });
      if (!variant) {
        throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: `Variant ${item.variantId} not found` });
      }
      const stockAfter = variant.stock + item.quantity;
      const updated = await transaction.productVariant.updateMany({
        where: { id: variant.id, stock: variant.stock, deletedAt: null },
        data: { stock: stockAfter },
      });
      if (updated.count !== 1) {
        throw new AppError({ statusCode: 409, code: "STOCK_CONFLICT", message: "Stock changed concurrently; retry the import" });
      }
      const inventoryTransaction = await transaction.inventoryTransaction.create({
        data: {
          variantId: variant.id,
          createdById: actorId,
          type: InventoryTransactionType.IMPORT,
          quantityDelta: item.quantity,
          stockBefore: variant.stock,
          stockAfter,
          reference,
          reason: input.reason,
        },
      });
      transactions.push({ variantId: variant.id, sku: variant.sku, stockBefore: variant.stock, stockAfter, transactionId: inventoryTransaction.id });
    }
    return transactions;
  });
  return { reference, items: result };
}
