import type { Request, Response } from "express";
import { sendNoContent, sendSuccess } from "../../utils/api-response.js";
import type { AddressCreateInput, AddressUpdateInput } from "./address.schema.js";
import { createAddress, deleteAddress, listAddresses, setDefaultAddress, updateAddress } from "./address.service.js";

const userId = (request: Request) => request.auth!.userId;

export async function listAddressesController(request: Request, response: Response) {
  return sendSuccess(response, { message: "Addresses fetched successfully", data: { items: await listAddresses(userId(request)) } });
}
export async function createAddressController(request: Request, response: Response) {
  const address = await createAddress(userId(request), request.body as AddressCreateInput);
  return sendSuccess(response, { statusCode: 201, message: "Address created successfully", data: { address } });
}
export async function updateAddressController(request: Request, response: Response) {
  const address = await updateAddress(userId(request), request.params.addressId as string, request.body as AddressUpdateInput);
  return sendSuccess(response, { message: "Address updated successfully", data: { address } });
}
export async function setDefaultAddressController(request: Request, response: Response) {
  const address = await setDefaultAddress(userId(request), request.params.addressId as string);
  return sendSuccess(response, { message: "Default address updated", data: { address } });
}
export async function deleteAddressController(request: Request, response: Response) {
  await deleteAddress(userId(request), request.params.addressId as string);
  return sendNoContent(response);
}
