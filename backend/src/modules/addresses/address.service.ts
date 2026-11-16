import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AddressCreateInput, AddressUpdateInput } from "./address.schema.js";

function notFound(): AppError {
  return new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Address not found" });
}

export function listAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
}

export async function createAddress(userId: string, input: AddressCreateInput) {
  return prisma.$transaction(async (transaction) => {
    const count = await transaction.address.count({ where: { userId } });
    const isDefault = input.isDefault || count === 0;
    if (isDefault) await transaction.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    return transaction.address.create({ data: { ...input, line2: input.line2 ?? null, postalCode: input.postalCode ?? null, userId, isDefault } });
  });
}

export async function updateAddress(userId: string, addressId: string, input: AddressUpdateInput) {
  const data: Prisma.AddressUpdateManyMutationInput = {};
  if (input.recipientName !== undefined) data.recipientName = input.recipientName;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.line1 !== undefined) data.line1 = input.line1;
  if (input.line2 !== undefined) data.line2 = input.line2;
  if (input.ward !== undefined) data.ward = input.ward;
  if (input.district !== undefined) data.district = input.district;
  if (input.province !== undefined) data.province = input.province;
  if (input.postalCode !== undefined) data.postalCode = input.postalCode;
  const result = await prisma.address.updateMany({ where: { id: addressId, userId }, data });
  if (result.count === 0) throw notFound();
  return prisma.address.findUniqueOrThrow({ where: { id: addressId } });
}

export async function setDefaultAddress(userId: string, addressId: string) {
  return prisma.$transaction(async (transaction) => {
    const address = await transaction.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw notFound();
    await transaction.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    return transaction.address.update({ where: { id: address.id }, data: { isDefault: true } });
  });
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const address = await transaction.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw notFound();
    await transaction.address.delete({ where: { id: address.id } });
    if (address.isDefault) {
      const replacement = await transaction.address.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true } });
      if (replacement) await transaction.address.update({ where: { id: replacement.id }, data: { isDefault: true } });
    }
  });
}
