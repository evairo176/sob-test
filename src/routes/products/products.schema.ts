import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

export const ProductSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier for the product",
    example: "clq123abc456def789",
  }),
  name: z.string().min(1, "Product name is required").openapi({
    description: "Name of the product",
    example: "iPhone 15",
  }),
  slug: z.string().min(1, "Slug is required").openapi({
    description: "URL-friendly version of the product name",
    example: "iphone-15",
  }),
  buyingPrice: z
    .number()
    .nonnegative("Buying price must be a non-negative number")
    .default(0)
    .openapi({
      description: "Cost price of the product",
      example: 800,
    }),
  price: z.number().positive("Price must be a positive number").openapi({
    description: "Selling price of the product",
    example: 999,
  }),
  image: z
    .string()
    .url("Image must be a valid URL")
    .optional()
    .nullable()
    .openapi({
      description: "URL of the product image",
      example: "https://example.com/image.jpg",
    }),
  createdAt: z.date().openapi({
    description: "Date when the product was created",
  }),
  updatedAt: z.date().openapi({
    description: "Date when the product was last updated",
  }),
});

export const IdParamSchema = z.object({
  id: z
    .string()
    .min(1, "Invalid ID format")
    .openapi({
      description: "Product ID",
      example: "clq123abc456def789",
      param: { name: "id", in: "path" },
    }),
});

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Common response schemas
export const ErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.array(z.any()).optional(),
});

export const MessageSchema = z.object({
  message: z.string(),
});

// Types
export type Product = z.infer<typeof ProductSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
