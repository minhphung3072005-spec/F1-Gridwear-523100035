import { prisma } from "../../config/prisma.js";
import { ProductStatus } from "../../generated/prisma/enums.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { CartItemCreateInput, CartMergeInput } from "./cart.schema.js";

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: {
        include: {
          size: { select: { id: true, name: true, slug: true } },
          color: { select: { id: true, name: true, slug: true, hexCode: true } },
          product: {
            include: {
              images: {
                orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
                take: 1,
                select: { id: true, urlSnapshot: true, altText: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRecord = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export function effectiveUnitPrice(input: {
  productBasePrice: number;
  productSalePrice: number | null;
  variantPrice: number | null;
  variantSalePrice: number | null;
}): number {
  return (
    input.variantSalePrice ??
    input.variantPrice ??
    input.productSalePrice ??
    input.productBasePrice
  );
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function mapCart(cart: CartRecord) {
  let subtotal = 0;
  let itemCount = 0;
  const items = cart.items.map((item) => {
    const { variant } = item;
    const productBasePrice = variant.product.basePrice.toNumber();
    const productSalePrice = variant.product.salePrice?.toNumber() ?? null;
    const variantPrice = variant.price?.toNumber() ?? null;
    const variantSalePrice = variant.salePrice?.toNumber() ?? null;
    const unitPrice = effectiveUnitPrice({
      productBasePrice,
      productSalePrice,
      variantPrice,
      variantSalePrice,
    });
    const lineTotal = money(unitPrice * item.quantity);
    const isAvailable =
      variant.isActive &&
      !variant.deletedAt &&
      variant.product.status === ProductStatus.ACTIVE &&
      !variant.product.deletedAt &&
      variant.stock >= item.quantity;
    subtotal = money(subtotal + lineTotal);
    itemCount += item.quantity;

    return {
      id: item.id,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      isAvailable,
      availabilityCode: !variant.isActive || variant.deletedAt || variant.product.status !== ProductStatus.ACTIVE || variant.product.deletedAt
        ? "VARIANT_UNAVAILABLE"
        : variant.stock < item.quantity
          ? "INSUFFICIENT_STOCK"
          : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      variant: {
        id: variant.id,
        sku: variant.sku,
        stock: variant.stock,
        price: variantPrice,
        salePrice: variantSalePrice,
        size: variant.size,
        color: variant.color,
      },
      product: {
        id: variant.product.id,
        name: variant.product.name,
        slug: variant.product.slug,
        basePrice: productBasePrice,
        salePrice: productSalePrice,
        image: variant.product.images[0] ?? null,
      },
    };
  });
  const discount = 0;
  const shipping = 0;

  return {
    id: cart.id,
    items,
    summary: {
      distinctItems: items.length,
      itemCount,
      subtotal,
      discount,
      shipping,
      total: money(subtotal - discount + shipping),
      hasUnavailableItems: items.some((item) => !item.isAvailable),
    },
    updatedAt: cart.updatedAt,
  };
}

async function ensureCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
}

async function cartForUser(userId: string) {
  await ensureCart(userId);
  return prisma.cart.findUniqueOrThrow({ where: { userId }, include: cartInclude });
}

function unavailableVariant(): AppError {
  return new AppError({
    statusCode: 422,
    code: "VARIANT_UNAVAILABLE",
    message: "Variant is inactive or its product is unavailable",
  });
}

function insufficientStock(variantId: string, requested: number, available: number): AppError {
  return new AppError({
    statusCode: 409,
    code: "INSUFFICIENT_STOCK",
    message: "Requested quantity exceeds current stock",
    errors: [
      {
        field: `items.${variantId}`,
        message: `Requested ${requested}, but only ${available} available`,
        meta: { variantId, requested, available },
      },
    ],
  });
}

async function activeVariant(transaction: Prisma.TransactionClient, variantId: string) {
  const variant = await transaction.productVariant.findFirst({
    where: {
      id: variantId,
      isActive: true,
      deletedAt: null,
      product: { status: ProductStatus.ACTIVE, deletedAt: null },
    },
    select: { id: true, stock: true },
  });
  if (!variant) throw unavailableVariant();
  return variant;
}

export async function getCart(userId: string) {
  return mapCart(await cartForUser(userId));
}

export async function addCartItem(userId: string, input: CartItemCreateInput) {
  await prisma.$transaction(async (transaction) => {
    const variant = await activeVariant(transaction, input.variantId);
    const cart = await transaction.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });
    const current = await transaction.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: input.variantId } },
      select: { id: true, quantity: true },
    });
    const requested = (current?.quantity ?? 0) + input.quantity;
    if (requested > variant.stock) throw insufficientStock(variant.id, requested, variant.stock);

    if (current) {
      const updated = await transaction.cartItem.updateMany({
        where: { id: current.id, quantity: current.quantity },
        data: { quantity: requested },
      });
      if (updated.count !== 1) {
        throw new AppError({ statusCode: 409, code: "CART_CONFLICT", message: "Cart changed concurrently; retry the request" });
      }
    } else {
      await transaction.cartItem.create({
        data: { cartId: cart.id, variantId: variant.id, quantity: input.quantity },
      });
    }
  });
  return getCart(userId);
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  await prisma.$transaction(async (transaction) => {
    const item = await transaction.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      select: { id: true, variantId: true, quantity: true },
    });
    if (!item) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Cart item not found" });
    const variant = await activeVariant(transaction, item.variantId);
    if (quantity > variant.stock) throw insufficientStock(variant.id, quantity, variant.stock);
    const updated = await transaction.cartItem.updateMany({
      where: { id: item.id, quantity: item.quantity },
      data: { quantity },
    });
    if (updated.count !== 1) {
      throw new AppError({ statusCode: 409, code: "CART_CONFLICT", message: "Cart changed concurrently; retry the request" });
    }
  });
  return getCart(userId);
}

export async function removeCartItem(userId: string, itemId: string): Promise<void> {
  const result = await prisma.cartItem.deleteMany({ where: { id: itemId, cart: { userId } } });
  if (result.count === 0) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Cart item not found" });
}

export async function clearCart(userId: string): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
}

export async function mergeCart(userId: string, input: CartMergeInput) {
  await prisma.$transaction(async (transaction) => {
    const cart = await transaction.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });
    const variantIds = input.items.map((item) => item.variantId);
    const variants = await transaction.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isActive: true,
        deletedAt: null,
        product: { status: ProductStatus.ACTIVE, deletedAt: null },
      },
      select: { id: true, stock: true },
    });
    if (variants.length !== variantIds.length) throw unavailableVariant();

    const existingItems = await transaction.cartItem.findMany({
      where: { cartId: cart.id, variantId: { in: variantIds } },
      select: { id: true, variantId: true, quantity: true },
    });
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
    const existingMap = new Map(existingItems.map((item) => [item.variantId, item]));

    for (const guestItem of input.items) {
      const variant = variantMap.get(guestItem.variantId)!;
      const current = existingMap.get(guestItem.variantId);
      const requested = guestItem.quantity + (current?.quantity ?? 0);
      if (requested > variant.stock) throw insufficientStock(variant.id, requested, variant.stock);
      if (current) {
        const updated = await transaction.cartItem.updateMany({
          where: { id: current.id, quantity: current.quantity },
          data: { quantity: requested },
        });
        if (updated.count !== 1) {
          throw new AppError({ statusCode: 409, code: "CART_CONFLICT", message: "Cart changed concurrently; retry the request" });
        }
      } else {
        await transaction.cartItem.create({
          data: { cartId: cart.id, variantId: guestItem.variantId, quantity: guestItem.quantity },
        });
      }
    }
  });
  return getCart(userId);
}
