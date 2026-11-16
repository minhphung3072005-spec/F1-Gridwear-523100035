import { prisma } from "../../config/prisma.js";
import { OrderStatus, UserRole } from "../../generated/prisma/enums.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import type { CustomerListQuery } from "./customer.schema.js";

const customerSelect = {
  id: true, email: true, fullName: true, phone: true, avatarUrl: true, isActive: true,
  createdAt: true, updatedAt: true,
  _count: { select: { orders: true, addresses: true, reviews: true } },
} satisfies Prisma.UserSelect;

export async function listCustomers(query: CustomerListQuery) {
  const where: Prisma.UserWhereInput = {
    role: UserRole.CUSTOMER, deletedAt: null,
    ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    ...(query.q ? { OR: [{ fullName: { contains: query.q } }, { email: { contains: query.q } }, { phone: { contains: query.q } }] } : {}),
  };
  const [items, totalItems] = await prisma.$transaction([
    prisma.user.findMany({ where, select: customerSelect, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.user.count({ where }),
  ]);
  return { items, pagination: paginationMeta(query.page, query.limit, totalItems) };
}

export async function getCustomer(id: string) {
  const customer = await prisma.user.findFirst({
    where: { id, role: UserRole.CUSTOMER, deletedAt: null },
    select: { ...customerSelect, addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }, orders: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, orderCode: true, status: true, total: true, createdAt: true } } },
  });
  if (!customer) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Customer not found" });
  const spending = await prisma.order.aggregate({ where: { userId: id, status: OrderStatus.DELIVERED }, _sum: { total: true } });
  return { ...customer, totalSpent: spending._sum.total?.toNumber() ?? 0, orders: customer.orders.map((order) => ({ ...order, total: order.total.toNumber() })) };
}

export async function updateCustomerStatus(id: string, isActive: boolean) {
  const customer = await prisma.user.findFirst({ where: { id, role: UserRole.CUSTOMER, deletedAt: null }, select: { id: true } });
  if (!customer) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Customer not found" });
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.user.update({ where: { id }, data: { isActive, tokenVersion: { increment: 1 } }, select: customerSelect });
    if (!isActive) await transaction.refreshSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    return updated;
  });
}
