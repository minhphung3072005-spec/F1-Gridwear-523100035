import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { idempotencyKeySchema } from "./order.schema.js";
import type { AdminOrderQuery, CancelOrderInput, CheckoutInput, CustomerOrderQuery, OrderStatusInput, PaymentStatusInput } from "./order.schema.js";
import { cancelCustomerOrder, checkout, getAdminOrder, getCustomerOrder, listAdminOrders, listCustomerOrders, updateAdminOrderStatus, updateAdminPaymentStatus } from "./order.service.js";

const userId = (request: Request) => request.auth!.userId;

export async function checkoutController(request: Request, response: Response) {
  const parsed = idempotencyKeySchema.safeParse(request.header("Idempotency-Key"));
  if (!parsed.success) throw new AppError({ statusCode: 400, code: "IDEMPOTENCY_KEY_REQUIRED", message: "A valid UUID Idempotency-Key header is required", errors: [{ field: "Idempotency-Key", message: "Must be a valid UUID" }] });
  const result = await checkout(userId(request), parsed.data, request.body as CheckoutInput);
  return sendSuccess(response, { statusCode: result.replayed ? 200 : 201, message: result.replayed ? "Existing order returned" : "Order placed successfully", data: result });
}
export async function listCustomerOrdersController(request: Request, response: Response) {
  return sendSuccess(response, { message: "Orders fetched successfully", data: await listCustomerOrders(userId(request), request.query as unknown as CustomerOrderQuery) });
}
export async function getCustomerOrderController(request: Request, response: Response) {
  return sendSuccess(response, { message: "Order fetched successfully", data: { order: await getCustomerOrder(userId(request), request.params.orderId as string) } });
}
export async function cancelCustomerOrderController(request: Request, response: Response) {
  const input = request.body as CancelOrderInput;
  return sendSuccess(response, { message: "Order cancelled successfully", data: { order: await cancelCustomerOrder(userId(request), request.params.orderId as string, input.reason) } });
}
export async function listAdminOrdersController(request: Request, response: Response) {
  return sendSuccess(response, { message: "Orders fetched successfully", data: await listAdminOrders(request.query as unknown as AdminOrderQuery) });
}
export async function getAdminOrderController(request: Request, response: Response) {
  return sendSuccess(response, { message: "Order fetched successfully", data: { order: await getAdminOrder(request.params.orderId as string) } });
}
export async function updateAdminOrderStatusController(request: Request, response: Response) {
  const input = request.body as OrderStatusInput;
  const order = await updateAdminOrderStatus(request.params.orderId as string, input.status, userId(request), input.note);
  return sendSuccess(response, { message: "Order status updated successfully", data: { order } });
}
export async function updateAdminPaymentStatusController(request: Request, response: Response) {
  const input = request.body as PaymentStatusInput;
  const order = await updateAdminPaymentStatus(request.params.orderId as string, input.status);
  return sendSuccess(response, { message: "Payment status updated successfully", data: { order } });
}
