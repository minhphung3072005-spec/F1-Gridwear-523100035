import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import type { CustomerListQuery, CustomerStatusInput } from "./customer.schema.js";
import { getCustomer, listCustomers, updateCustomerStatus } from "./customer.service.js";

export async function listCustomersController(request: Request, response: Response) { return sendSuccess(response, { message: "Customers fetched successfully", data: await listCustomers(request.query as unknown as CustomerListQuery) }); }
export async function getCustomerController(request: Request, response: Response) { return sendSuccess(response, { message: "Customer fetched successfully", data: { customer: await getCustomer(request.params.customerId as string) } }); }
export async function updateCustomerStatusController(request: Request, response: Response) { return sendSuccess(response, { message: "Customer status updated successfully", data: { customer: await updateCustomerStatus(request.params.customerId as string, (request.body as CustomerStatusInput).isActive) } }); }
