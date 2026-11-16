import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import type {
  InventoryAdjustmentInput,
  InventoryImportInput,
  InventoryListQuery,
  InventoryTransactionQuery,
} from "./inventory.schema.js";
import {
  adjustInventory,
  importInventory,
  listInventory,
  listInventoryTransactions,
} from "./inventory.service.js";

function actorId(request: Request): string {
  if (!request.auth) {
    throw new AppError({ statusCode: 401, code: "AUTHENTICATION_REQUIRED", message: "Authentication is required" });
  }
  return request.auth.userId;
}

export async function listInventoryController(request: Request, response: Response) {
  const result = await listInventory(request.query as unknown as InventoryListQuery);
  return sendSuccess(response, { message: "Inventory fetched successfully", data: result });
}

export async function listInventoryTransactionsController(request: Request, response: Response) {
  const result = await listInventoryTransactions(
    request.params.variantId as string,
    request.query as unknown as InventoryTransactionQuery,
  );
  return sendSuccess(response, { message: "Inventory transactions fetched successfully", data: result });
}

export async function adjustInventoryController(request: Request, response: Response) {
  const result = await adjustInventory(
    request.params.variantId as string,
    request.body as InventoryAdjustmentInput,
    actorId(request),
  );
  return sendSuccess(response, { message: "Inventory adjusted successfully", data: result });
}

export async function importInventoryController(request: Request, response: Response) {
  const result = await importInventory(request.body as InventoryImportInput, actorId(request));
  return sendSuccess(response, { statusCode: 201, message: "Inventory imported successfully", data: result });
}
