import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { OrderStatus, PaymentStatus, ProductStatus, UserRole } from "../../generated/prisma/enums.js";
import type { DashboardRangeQuery, DashboardTimelineQuery, DashboardTopQuery } from "./dashboard.schema.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DashboardRange = { from: Date; to: Date };
export type TimelineSource = { date: Date; revenue?: number; orders?: number };

export function resolveDashboardRange(query: DashboardRangeQuery): DashboardRange {
  const to = query.to ?? new Date();
  const from = query.from ?? new Date(to.getTime() - 29 * DAY_MS);
  return { from, to };
}

function periodKey(date: Date, groupBy: "day" | "month"): string {
  const iso = date.toISOString();
  return groupBy === "day" ? iso.slice(0, 10) : iso.slice(0, 7);
}

function nextPeriod(date: Date, groupBy: "day" | "month"): Date {
  const result = new Date(date);
  if (groupBy === "day") result.setUTCDate(result.getUTCDate() + 1);
  else result.setUTCMonth(result.getUTCMonth() + 1, 1);
  return result;
}

function periodStart(date: Date, groupBy: "day" | "month"): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  if (groupBy === "month") result.setUTCDate(1);
  return result;
}

export function buildTimeline(range: DashboardRange, groupBy: "day" | "month", source: TimelineSource[]) {
  const values = new Map<string, { revenue: number; orders: number }>();
  for (const item of source) {
    const key = periodKey(item.date, groupBy);
    const current = values.get(key) ?? { revenue: 0, orders: 0 };
    current.revenue += item.revenue ?? 0;
    current.orders += item.orders ?? 0;
    values.set(key, current);
  }
  const points = [];
  for (let cursor = periodStart(range.from, groupBy); cursor <= range.to; cursor = nextPeriod(cursor, groupBy)) {
    const period = periodKey(cursor, groupBy);
    const value = values.get(period) ?? { revenue: 0, orders: 0 };
    points.push({ period, revenue: Math.round(value.revenue * 100) / 100, orders: value.orders });
  }
  return points;
}

function dateWhere(range: DashboardRange): Prisma.DateTimeFilter {
  return { gte: range.from, lte: range.to };
}

export async function getDashboardSummary(query: DashboardRangeQuery) {
  const range = resolveDashboardRange(query);
  const deliveredWhere: Prisma.OrderWhereInput = {
    status: OrderStatus.DELIVERED,
    paymentStatus: { not: PaymentStatus.REFUNDED },
    deliveredAt: dateWhere(range),
  };
  const [revenue, totalOrders, totalCustomers, newCustomers, totalProducts, outOfStockProducts, lowStockProducts] = await prisma.$transaction([
    prisma.order.aggregate({ where: deliveredWhere, _sum: { total: true } }),
    prisma.order.count({ where: { createdAt: dateWhere(range) } }),
    prisma.user.count({ where: { role: UserRole.CUSTOMER, isActive: true, deletedAt: null } }),
    prisma.user.count({ where: { role: UserRole.CUSTOMER, isActive: true, deletedAt: null, createdAt: dateWhere(range) } }),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE, deletedAt: null } }),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE, deletedAt: null, variants: { some: { deletedAt: null }, none: { deletedAt: null, stock: { gt: 0 } } } } }),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE, deletedAt: null, variants: { some: { deletedAt: null, stock: { gte: 1, lte: 5 } } } } }),
  ]);
  return {
    range,
    totalRevenue: revenue._sum.total?.toNumber() ?? 0,
    totalOrders,
    totalCustomers,
    newCustomers,
    totalProducts,
    outOfStockProducts,
    lowStockProducts,
  };
}

export async function getDashboardRevenue(query: DashboardTimelineQuery) {
  const range = resolveDashboardRange(query);
  const [delivered, orders] = await prisma.$transaction([
    prisma.order.findMany({
      where: { status: OrderStatus.DELIVERED, paymentStatus: { not: PaymentStatus.REFUNDED }, deliveredAt: dateWhere(range) },
      select: { deliveredAt: true, total: true },
    }),
    prisma.order.findMany({ where: { createdAt: dateWhere(range) }, select: { createdAt: true } }),
  ]);
  const source: TimelineSource[] = [
    ...delivered.filter((order) => order.deliveredAt !== null).map((order) => ({ date: order.deliveredAt!, revenue: order.total.toNumber() })),
    ...orders.map((order) => ({ date: order.createdAt, orders: 1 })),
  ];
  return { range, groupBy: query.groupBy, points: buildTimeline(range, query.groupBy, source) };
}

export async function getDashboardOrderDistribution(query: DashboardRangeQuery) {
  const range = resolveDashboardRange(query);
  const groups = await prisma.order.groupBy({ by: ["status"], where: { createdAt: dateWhere(range) }, _count: { _all: true } });
  const counts = new Map(groups.map((group) => [group.status, group._count._all]));
  const items = Object.values(OrderStatus).map((status) => ({ status, count: counts.get(status) ?? 0 }));
  return { range, total: items.reduce((sum, item) => sum + item.count, 0), items };
}

type SalesItem = {
  productId: string | null;
  productName: string;
  quantity: number;
  subtotal: { toNumber(): number };
  product: { slug: string; category: { id: string; name: string; slug: string } | null } | null;
};

async function deliveredItems(range: DashboardRange): Promise<SalesItem[]> {
  return prisma.orderItem.findMany({
    where: { order: { status: OrderStatus.DELIVERED, paymentStatus: { not: PaymentStatus.REFUNDED }, deliveredAt: dateWhere(range) } },
    select: { productId: true, productName: true, quantity: true, subtotal: true, product: { select: { slug: true, category: { select: { id: true, name: true, slug: true } } } } },
  });
}

export async function getDashboardTopProducts(query: DashboardTopQuery) {
  const range = resolveDashboardRange(query);
  const items = await deliveredItems(range);
  const aggregate = new Map<string, { productId: string | null; name: string; slug: string | null; quantity: number; revenue: number }>();
  for (const item of items) {
    const key = item.productId ?? `snapshot:${item.productName}`;
    const current = aggregate.get(key) ?? { productId: item.productId, name: item.productName, slug: item.product?.slug ?? null, quantity: 0, revenue: 0 };
    current.quantity += item.quantity;
    current.revenue += item.subtotal.toNumber();
    aggregate.set(key, current);
  }
  const products = [...aggregate.values()].sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue).slice(0, query.limit).map((item, index) => ({ rank: index + 1, ...item, revenue: Math.round(item.revenue * 100) / 100 }));
  return { range, items: products };
}

export async function getDashboardTopCategories(query: DashboardTopQuery) {
  const range = resolveDashboardRange(query);
  const items = await deliveredItems(range);
  const aggregate = new Map<string, { categoryId: string | null; name: string; slug: string | null; quantity: number; revenue: number }>();
  for (const item of items) {
    const category = item.product?.category;
    const key = category?.id ?? "deleted-or-unknown";
    const current = aggregate.get(key) ?? { categoryId: category?.id ?? null, name: category?.name ?? "Unknown", slug: category?.slug ?? null, quantity: 0, revenue: 0 };
    current.quantity += item.quantity;
    current.revenue += item.subtotal.toNumber();
    aggregate.set(key, current);
  }
  const categories = [...aggregate.values()].sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue).slice(0, query.limit).map((item, index) => ({ rank: index + 1, ...item, revenue: Math.round(item.revenue * 100) / 100 }));
  return { range, items: categories };
}
