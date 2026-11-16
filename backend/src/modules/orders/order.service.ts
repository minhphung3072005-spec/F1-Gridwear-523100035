import { createHash, randomUUID } from "node:crypto";

import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import {
  CouponRedemptionStatus,
  IdempotencyStatus,
  InventoryTransactionType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductStatus,
} from "../../generated/prisma/enums.js";
import { AppError } from "../../shared/errors/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import { effectiveUnitPrice } from "../cart/cart.service.js";
import { calculateCoupon } from "../coupons/coupon.service.js";
import type { AdminOrderQuery, CheckoutInput, CustomerOrderQuery } from "./order.schema.js";

const SHIPPING_FEE = 50_000;
const FREE_SHIPPING_FROM = 2_000_000;
const money = (value: number) => Math.round(value * 100) / 100;

const orderDetailInclude = {
  items: { orderBy: { createdAt: "asc" as const }, include: { review: { select: { id: true, rating: true, status: true } } } },
  statusHistory: { orderBy: { createdAt: "asc" as const }, include: { actor: { select: { id: true, fullName: true } } } },
  payments: { orderBy: { createdAt: "desc" as const } },
  couponRedemption: true,
} satisfies Prisma.OrderInclude;

type OrderDetail = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

function mapOrder(order: OrderDetail) {
  return {
    ...order,
    subtotal: order.subtotal.toNumber(),
    discount: order.discount.toNumber(),
    shippingFee: order.shippingFee.toNumber(),
    total: order.total.toNumber(),
    items: order.items.map((item) => ({ ...item, unitPrice: item.unitPrice.toNumber(), subtotal: item.subtotal.toNumber() })),
    payments: order.payments.map((payment) => ({ ...payment, amount: payment.amount.toNumber() })),
    couponRedemption: order.couponRedemption ? { ...order.couponRedemption, discountAmount: order.couponRedemption.discountAmount.toNumber() } : null,
  };
}

function notFound(): AppError {
  return new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Order not found" });
}

function orderCode(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `F1-${date}-${Date.now().toString().slice(-6)}${randomUUID().slice(0, 4).toUpperCase()}`;
}

function requestHash(userId: string, input: CheckoutInput): string {
  return createHash("sha256").update(JSON.stringify({ userId, shippingAddressId: input.shippingAddressId, couponCode: input.couponCode ?? null, paymentMethod: input.paymentMethod, note: input.note ?? null })).digest("hex");
}

function stockError(variantId: string, requested: number, available: number): AppError {
  return new AppError({ statusCode: 409, code: "INSUFFICIENT_STOCK", message: "An item no longer has enough stock", errors: [{ field: `items.${variantId}`, message: `Requested ${requested}, but only ${available} available`, meta: { variantId, requested, available } }] });
}

export async function checkout(userId: string, key: string, input: CheckoutInput) {
  const hash = requestHash(userId, input);
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.checkoutIdempotency.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: key } } });
    if (existing) {
      if (existing.requestHash !== hash) throw new AppError({ statusCode: 409, code: "IDEMPOTENCY_KEY_REUSED", message: "Idempotency key was already used with a different request" });
      if (existing.status === IdempotencyStatus.COMPLETED && existing.orderId) {
        const saved = await transaction.order.findUnique({ where: { id: existing.orderId }, include: orderDetailInclude });
        if (!saved) throw notFound();
        return { order: mapOrder(saved), replayed: true };
      }
      throw new AppError({ statusCode: 409, code: "CHECKOUT_IN_PROGRESS", message: "Checkout with this key is already in progress" });
    }

    const idempotency = await transaction.checkoutIdempotency.create({
      data: { userId, idempotencyKey: key, requestHash: hash, status: IdempotencyStatus.IN_PROGRESS, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
    const [user, address, cart] = await Promise.all([
      transaction.user.findUnique({ where: { id: userId }, select: { email: true } }),
      transaction.address.findFirst({ where: { id: input.shippingAddressId, userId } }),
      transaction.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  size: true,
                  color: true,
                  product: {
                    include: {
                      images: {
                        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);
    if (!user) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Customer not found" });
    if (!address) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Shipping address not found" });
    if (!cart || cart.items.length === 0) throw new AppError({ statusCode: 422, code: "CART_EMPTY", message: "Cart is empty" });

    const checkoutItems = cart.items.map((item) => {
      const variant = item.variant;
      if (!variant.isActive || variant.deletedAt || variant.product.status !== ProductStatus.ACTIVE || variant.product.deletedAt) {
        throw new AppError({ statusCode: 422, code: "VARIANT_UNAVAILABLE", message: `Variant ${variant.sku} is unavailable` });
      }
      if (variant.stock < item.quantity) throw stockError(variant.id, item.quantity, variant.stock);
      const unitPrice = effectiveUnitPrice({ productBasePrice: variant.product.basePrice.toNumber(), productSalePrice: variant.product.salePrice?.toNumber() ?? null, variantPrice: variant.price?.toNumber() ?? null, variantSalePrice: variant.salePrice?.toNumber() ?? null });
      return { cartItemId: item.id, quantity: item.quantity, variant, unitPrice, subtotal: money(unitPrice * item.quantity) };
    }).sort((left, right) => left.variant.id.localeCompare(right.variant.id));
    const subtotal = money(checkoutItems.reduce((sum, item) => sum + item.subtotal, 0));
    const couponResult = input.couponCode ? await calculateCoupon(transaction, userId, input.couponCode, subtotal) : null;
    const discount = couponResult?.discount ?? 0;
    const shippingFee = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
    const total = money(subtotal - discount + shippingFee);

    const order = await transaction.order.create({
      data: {
        userId, couponId: couponResult?.coupon.id ?? null, orderCode: orderCode(), paymentMethod: input.paymentMethod,
        receiverName: address.recipientName, receiverPhone: address.phone, receiverEmail: user.email,
        addressLine1: address.line1, addressLine2: address.line2, ward: address.ward, district: address.district, province: address.province, postalCode: address.postalCode,
        couponCode: couponResult?.coupon.code ?? null, note: input.note ?? null, subtotal, discount, shippingFee, total,
      },
    });

    for (const item of checkoutItems) {
      const updated = await transaction.productVariant.updateMany({ where: { id: item.variant.id, stock: item.variant.stock, isActive: true, deletedAt: null }, data: { stock: { decrement: item.quantity } } });
      if (updated.count !== 1) {
        const current = await transaction.productVariant.findUnique({ where: { id: item.variant.id }, select: { stock: true } });
        throw stockError(item.variant.id, item.quantity, current?.stock ?? 0);
      }
      const orderItem = await transaction.orderItem.create({ data: {
        orderId: order.id, productId: item.variant.productId, variantId: item.variant.id,
        productName: item.variant.product.name, sku: item.variant.sku, size: item.variant.size.name, color: item.variant.color.name,
        imageUrl: item.variant.product.images[0]?.urlSnapshot ?? null, unitPrice: item.unitPrice, quantity: item.quantity, subtotal: item.subtotal,
      } });
      await transaction.inventoryTransaction.create({ data: {
        variantId: item.variant.id, orderId: order.id, orderItemId: orderItem.id, type: InventoryTransactionType.SALE,
        quantityDelta: -item.quantity, stockBefore: item.variant.stock, stockAfter: item.variant.stock - item.quantity,
        reference: order.orderCode, reason: "Checkout sale",
      } });
    }

    if (couponResult) {
      const couponWhere: Prisma.CouponWhereInput = { id: couponResult.coupon.id, usedCount: couponResult.coupon.usedCount, ...(couponResult.coupon.usageLimit !== null ? { usedCount: { equals: couponResult.coupon.usedCount, lt: couponResult.coupon.usageLimit } } : {}) };
      const incremented = await transaction.coupon.updateMany({ where: couponWhere, data: { usedCount: { increment: 1 } } });
      if (incremented.count !== 1) throw new AppError({ statusCode: 409, code: "COUPON_USAGE_LIMIT_REACHED", message: "Coupon usage changed; retry checkout" });
      await transaction.couponRedemption.create({ data: { couponId: couponResult.coupon.id, userId, orderId: order.id, discountAmount: discount } });
    }
    await transaction.orderStatusHistory.create({ data: { orderId: order.id, actorId: userId, toStatus: OrderStatus.PENDING, note: "Order placed" } });
    await transaction.payment.create({ data: { orderId: order.id, provider: PaymentProvider.COD, amount: total, status: PaymentStatus.PENDING } });
    await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });
    await transaction.checkoutIdempotency.update({ where: { id: idempotency.id }, data: { status: IdempotencyStatus.COMPLETED, orderId: order.id, responseStatus: 201 } });
    const saved = await transaction.order.findUniqueOrThrow({ where: { id: order.id }, include: orderDetailInclude });
    return { order: mapOrder(saved), replayed: false };
  });
}

export async function listCustomerOrders(userId: string, query: CustomerOrderQuery) {
  const where: Prisma.OrderWhereInput = { userId, ...(query.status ? { status: query.status } : {}) };
  const [records, totalItems] = await prisma.$transaction([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit, include: orderDetailInclude }),
    prisma.order.count({ where }),
  ]);
  return { items: records.map(mapOrder), pagination: paginationMeta(query.page, query.limit, totalItems) };
}

export async function getCustomerOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: orderDetailInclude });
  if (!order) throw notFound();
  return mapOrder(order);
}

async function cancelInTransaction(transaction: Prisma.TransactionClient, orderId: string, actorId: string, reason: string, ownerId?: string) {
  const order = await transaction.order.findFirst({ where: { id: orderId, ...(ownerId ? { userId: ownerId } : {}) }, include: { items: true, couponRedemption: true } });
  if (!order) throw notFound();
  if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) throw new AppError({ statusCode: 409, code: "ORDER_NOT_CANCELLABLE", message: "Only pending or confirmed orders can be cancelled" });
  const changed = await transaction.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() } });
  if (changed.count !== 1) throw new AppError({ statusCode: 409, code: "ORDER_STATUS_CONFLICT", message: "Order status changed concurrently" });

  for (const item of [...order.items].sort((left, right) => (left.variantId ?? "").localeCompare(right.variantId ?? ""))) {
    if (!item.variantId) continue;
    const variant = await transaction.productVariant.findUnique({ where: { id: item.variantId }, select: { stock: true } });
    if (!variant) continue;
    await transaction.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    await transaction.inventoryTransaction.create({ data: { variantId: item.variantId, orderId: order.id, orderItemId: item.id, createdById: actorId, type: InventoryTransactionType.CANCEL_RETURN, quantityDelta: item.quantity, stockBefore: variant.stock, stockAfter: variant.stock + item.quantity, reference: order.orderCode, reason } });
  }
  if (order.couponRedemption?.status === CouponRedemptionStatus.APPLIED && order.couponId) {
    const released = await transaction.couponRedemption.updateMany({ where: { id: order.couponRedemption.id, status: CouponRedemptionStatus.APPLIED }, data: { status: CouponRedemptionStatus.RELEASED, releasedAt: new Date() } });
    if (released.count === 1) await transaction.coupon.update({ where: { id: order.couponId }, data: { usedCount: { decrement: 1 } } });
  }
  await transaction.payment.updateMany({ where: { orderId: order.id, status: PaymentStatus.PENDING }, data: { status: PaymentStatus.FAILED } });
  await transaction.orderStatusHistory.create({ data: { orderId: order.id, actorId, fromStatus: order.status, toStatus: OrderStatus.CANCELLED, note: reason } });
}

export async function cancelCustomerOrder(userId: string, orderId: string, reason: string) {
  await prisma.$transaction((transaction) => cancelInTransaction(transaction, orderId, userId, reason, userId));
  return getCustomerOrder(userId, orderId);
}

export async function listAdminOrders(query: AdminOrderQuery) {
  const where: Prisma.OrderWhereInput = {
    ...(query.status ? { status: query.status } : {}), ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(query.from || query.to ? { createdAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
    ...(query.q ? { OR: [{ orderCode: { contains: query.q } }, { receiverName: { contains: query.q } }, { receiverPhone: { contains: query.q } }, { receiverEmail: { contains: query.q } }] } : {}),
  };
  const [records, totalItems] = await prisma.$transaction([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit, include: orderDetailInclude }),
    prisma.order.count({ where }),
  ]);
  return { items: records.map(mapOrder), pagination: paginationMeta(query.page, query.limit, totalItems) };
}

export async function getAdminOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderDetailInclude });
  if (!order) throw notFound();
  return mapOrder(order);
}

const transitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [], [OrderStatus.CANCELLED]: [],
};

export function isValidOrderTransition(from: OrderStatus, to: OrderStatus): boolean { return transitions[from].includes(to); }

export async function updateAdminOrderStatus(orderId: string, status: OrderStatus, actorId: string, note?: string) {
  if (status === OrderStatus.CANCELLED) {
    await prisma.$transaction((transaction) => cancelInTransaction(transaction, orderId, actorId, note ?? "Cancelled by administrator"));
    return getAdminOrder(orderId);
  }
  await prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({ where: { id: orderId }, select: { status: true, paymentMethod: true } });
    if (!order) throw notFound();
    if (!isValidOrderTransition(order.status, status)) throw new AppError({ statusCode: 409, code: "INVALID_ORDER_TRANSITION", message: `Cannot move order from ${order.status} to ${status}` });
    const now = new Date();
    const updated = await transaction.order.updateMany({ where: { id: orderId, status: order.status }, data: { status, ...(status === OrderStatus.DELIVERED ? { deliveredAt: now, paymentStatus: PaymentStatus.PAID, paidAt: now } : {}) } });
    if (updated.count !== 1) throw new AppError({ statusCode: 409, code: "ORDER_STATUS_CONFLICT", message: "Order status changed concurrently" });
    if (status === OrderStatus.DELIVERED) await transaction.payment.updateMany({ where: { orderId }, data: { status: PaymentStatus.PAID, paidAt: now } });
    await transaction.orderStatusHistory.create({ data: { orderId, actorId, fromStatus: order.status, toStatus: status, note: note ?? null } });
  });
  return getAdminOrder(orderId);
}

export async function updateAdminPaymentStatus(orderId: string, status: PaymentStatus) {
  const now = new Date();
  const updated = await prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({ where: { id: orderId }, select: { id: true } });
    if (!order) throw notFound();
    await transaction.order.update({ where: { id: orderId }, data: { paymentStatus: status, paidAt: status === PaymentStatus.PAID ? now : null } });
    await transaction.payment.updateMany({ where: { orderId }, data: { status, paidAt: status === PaymentStatus.PAID ? now : null } });
    return order;
  });
  return getAdminOrder(updated.id);
}
