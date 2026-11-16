import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import { sendNoContent, sendSuccess } from "../../utils/api-response.js";
import type { CartItemCreateInput, CartItemUpdateInput, CartMergeInput } from "./cart.schema.js";
import {
  addCartItem,
  clearCart,
  getCart,
  mergeCart,
  removeCartItem,
  updateCartItem,
} from "./cart.service.js";

function userId(request: Request): string {
  if (!request.auth) {
    throw new AppError({ statusCode: 401, code: "AUTHENTICATION_REQUIRED", message: "Authentication is required" });
  }
  return request.auth.userId;
}

export async function getCartController(request: Request, response: Response) {
  const cart = await getCart(userId(request));
  return sendSuccess(response, { message: "Cart fetched successfully", data: { cart } });
}

export async function addCartItemController(request: Request, response: Response) {
  const cart = await addCartItem(userId(request), request.body as CartItemCreateInput);
  return sendSuccess(response, { statusCode: 201, message: "Item added to cart", data: { cart } });
}

export async function updateCartItemController(request: Request, response: Response) {
  const input = request.body as CartItemUpdateInput;
  const cart = await updateCartItem(userId(request), request.params.itemId as string, input.quantity);
  return sendSuccess(response, { message: "Cart item updated successfully", data: { cart } });
}

export async function removeCartItemController(request: Request, response: Response) {
  await removeCartItem(userId(request), request.params.itemId as string);
  return sendNoContent(response);
}

export async function clearCartController(request: Request, response: Response) {
  await clearCart(userId(request));
  return sendNoContent(response);
}

export async function mergeCartController(request: Request, response: Response) {
  const cart = await mergeCart(userId(request), request.body as CartMergeInput);
  return sendSuccess(response, { message: "Guest cart merged successfully", data: { cart } });
}
