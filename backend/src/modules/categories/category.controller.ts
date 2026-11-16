import type { Request, Response } from "express";

import { sendNoContent, sendSuccess } from "../../utils/api-response.js";
import type {
  CategoryCreateInput,
  CategoryListQuery,
  CategoryUpdateInput,
} from "./category.schema.js";
import {
  createCategory,
  deleteCategory,
  getPublicCategory,
  listAdminCategories,
  listPublicCategories,
  updateCategory,
} from "./category.service.js";

export async function listPublicCategoriesController(_request: Request, response: Response) {
  const items = await listPublicCategories();
  return sendSuccess(response, { message: "Categories fetched successfully", data: { items } });
}

export async function getPublicCategoryController(request: Request, response: Response) {
  const category = await getPublicCategory(request.params.slug as string);
  return sendSuccess(response, { message: "Category fetched successfully", data: { category } });
}

export async function listAdminCategoriesController(request: Request, response: Response) {
  const result = await listAdminCategories(request.query as unknown as CategoryListQuery);
  return sendSuccess(response, { message: "Categories fetched successfully", data: result });
}

export async function createCategoryController(request: Request, response: Response) {
  const category = await createCategory(request.body as CategoryCreateInput);
  return sendSuccess(response, {
    statusCode: 201,
    message: "Category created successfully",
    data: { category },
  });
}

export async function updateCategoryController(request: Request, response: Response) {
  const category = await updateCategory(
    request.params.categoryId as string,
    request.body as CategoryUpdateInput,
  );
  return sendSuccess(response, { message: "Category updated successfully", data: { category } });
}

export async function deleteCategoryController(request: Request, response: Response) {
  await deleteCategory(request.params.categoryId as string);
  return sendNoContent(response);
}
