import { IRouter, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { validateRequest } from "@/lib/validation";
import { createRoute } from "@/lib/create-route"; // Our custom createRoute
import {
  ProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  IdParamSchema,
  ErrorSchema,
  MessageSchema,
} from "./products.schema";
import * as handlers from "./products.handlers";

const router: IRouter = Router();

// Routes (unchanged)
router.get("/", handlers.listProducts);
router.post(
  "/",
  validateRequest({ body: CreateProductSchema }),
  handlers.createProduct
);
router.get(
  "/:id",
  validateRequest({ params: IdParamSchema }),
  handlers.getProduct
);
router.patch(
  "/:id",
  validateRequest({ params: IdParamSchema, body: UpdateProductSchema }),
  handlers.updateProduct
);
router.delete(
  "/:id",
  validateRequest({ params: IdParamSchema }),
  handlers.deleteProduct
);

// OpenAPI definitions using our createRoute helper
export const productsOpenAPI = [
  createRoute({
    method: "get",
    path: "/api/products",
    tags: ["Products"],
    summary: "List all products",
    responses: {
      [StatusCodes.OK]: {
        description: "List of products",
        content: { "application/json": { schema: ProductSchema.array() } },
      },
      [StatusCodes.INTERNAL_SERVER_ERROR]: {
        description: "Server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),

  createRoute({
    method: "post",
    path: "/api/products",
    tags: ["Products"],
    summary: "Create a new product",
    request: {
      body: {
        content: { "application/json": { schema: CreateProductSchema } },
        description: "Product data",
      },
    },
    responses: {
      [StatusCodes.CREATED]: {
        description: "Product created",
        content: { "application/json": { schema: ProductSchema } },
      },
      [StatusCodes.UNPROCESSABLE_ENTITY]: {
        description: "Validation error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),

  createRoute({
    method: "get",
    path: "/api/products/{id}",
    tags: ["Products"],
    summary: "Get a product by ID",
    request: { params: IdParamSchema },
    responses: {
      [StatusCodes.OK]: {
        description: "Product found",
        content: { "application/json": { schema: ProductSchema } },
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Product not found",
        content: { "application/json": { schema: MessageSchema } },
      },
    },
  }),

  createRoute({
    method: "patch",
    path: "/api/products/{id}",
    tags: ["Products"],
    summary: "Update a product",
    request: {
      params: IdParamSchema,
      body: {
        content: { "application/json": { schema: UpdateProductSchema } },
        description: "Product updates",
      },
    },
    responses: {
      [StatusCodes.OK]: {
        description: "Product updated",
        content: { "application/json": { schema: ProductSchema } },
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Product not found",
        content: { "application/json": { schema: MessageSchema } },
      },
    },
  }),

  createRoute({
    method: "delete",
    path: "/api/products/{id}",
    tags: ["Products"],
    summary: "Delete a product",
    request: { params: IdParamSchema },
    responses: {
      [StatusCodes.OK]: {
        description: "Product deleted",
        content: { "application/json": { schema: MessageSchema } },
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Product not found",
        content: { "application/json": { schema: MessageSchema } },
      },
    },
  }),
];

export default router;
