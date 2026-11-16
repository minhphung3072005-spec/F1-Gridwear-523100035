import type { Request, Response } from "express";
import { ReviewStatus } from "../../generated/prisma/enums.js";
import { sendNoContent, sendSuccess } from "../../utils/api-response.js";
import type { ReviewCreateInput, ReviewListQuery } from "./review.schema.js";
import { createCustomerReview, deleteReview, listReviews, updateReviewStatus } from "./review.service.js";
export async function listReviewsController(request: Request, response: Response) { return sendSuccess(response, { message: "Reviews fetched successfully", data: await listReviews(request.query as unknown as ReviewListQuery) }); }
export async function updateReviewStatusController(request: Request, response: Response) { return sendSuccess(response, { message: "Review status updated successfully", data: { review: await updateReviewStatus(request.params.reviewId as string, request.body.status as ReviewStatus) } }); }
export async function deleteReviewController(request: Request, response: Response) { await deleteReview(request.params.reviewId as string); return sendNoContent(response); }
export async function createCustomerReviewController(request: Request, response: Response) { return sendSuccess(response, { statusCode: 201, message: "Review submitted for moderation", data: { review: await createCustomerReview(request.auth!.userId, request.body as ReviewCreateInput) } }); }
