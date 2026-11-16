import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { OrderStatus, ReviewStatus } from "../../generated/prisma/enums.js";
import { AppError } from "../../shared/errors/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import type { ReviewCreateInput, ReviewListQuery } from "./review.schema.js";

const include = { user: { select: { id: true, fullName: true, email: true } }, product: { select: { id: true, name: true, slug: true } } } satisfies Prisma.ReviewInclude;
export async function listReviews(query: ReviewListQuery) {
  const where: Prisma.ReviewWhereInput = { deletedAt: null, ...(query.status ? { status: query.status } : {}), ...(query.rating ? { rating: query.rating } : {}), ...(query.q ? { OR: [{ title: { contains: query.q } }, { content: { contains: query.q } }, { user: { fullName: { contains: query.q } } }, { product: { name: { contains: query.q } } }] } : {}) };
  const [items, totalItems] = await prisma.$transaction([prisma.review.findMany({ where, include, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit }), prisma.review.count({ where })]);
  return { items, pagination: paginationMeta(query.page, query.limit, totalItems) };
}
export async function updateReviewStatus(id: string, status: ReviewStatus) {
  const existing = await prisma.review.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Review not found" });
  return prisma.review.update({ where: { id }, data: { status }, include });
}
export async function deleteReview(id: string) {
  const result = await prisma.review.updateMany({ where: { id, deletedAt: null }, data: { status: ReviewStatus.HIDDEN, deletedAt: new Date() } });
  if (!result.count) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Review not found" });
}

export async function createCustomerReview(userId: string, input: ReviewCreateInput) {
  const orderItem = await prisma.orderItem.findFirst({
    where: { id: input.orderItemId, order: { userId, status: OrderStatus.DELIVERED } },
    select: { id: true, productId: true },
  });
  if (!orderItem?.productId) throw new AppError({ statusCode: 422, code: "REVIEW_NOT_ALLOWED", message: "Only delivered products can be reviewed" });
  const existing = await prisma.review.findFirst({ where: { OR: [{ orderItemId: orderItem.id }, { userId, productId: orderItem.productId }] }, select: { id: true } });
  if (existing) throw new AppError({ statusCode: 409, code: "REVIEW_ALREADY_EXISTS", message: "You have already reviewed this product" });
  return prisma.review.create({
    data: { userId, productId: orderItem.productId, orderItemId: orderItem.id, rating: input.rating, title: input.title ?? null, content: input.content ?? null, status: ReviewStatus.PENDING },
    include,
  });
}
