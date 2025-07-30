import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { RouteParameter } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

export const TenantSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier for the tenant",
    example: "clq123abc456def789",
  }),
  name: z.string().min(1, "Tenant name is required").openapi({
    description: "Name of the tenant",
    example: "My Company",
  }),
  workers: z.number().min(1).max(50).default(3).openapi({
    description: "Number of worker threads",
    example: 5,
  }),
  isActive: z.boolean().default(true).openapi({
    description: "Whether the tenant is active",
    example: true,
  }),
  createdAt: z.date().openapi({
    description: "Date when the tenant was created",
  }),
  updatedAt: z.date().openapi({
    description: "Date when the tenant was last updated",
  }),
});

export const IdParamSchema: RouteParameter = z.object({
  id: z
    .string()
    .min(1, "Invalid ID format")
    .openapi({
      description: "Tenant ID",
      example: "clq123abc456def789",
      param: { name: "id", in: "path" },
    }),
});

export const CreateTenantSchema = TenantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateTenantSchema = TenantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const UpdateConcurrencySchema = z.object({
  workers: z.number().min(1).max(50).openapi({
    description: "Number of worker threads",
    example: 8,
  }),
});

export const PublishMessageSchema = z.object({
  payload: z.any().openapi({
    description: "Message payload",
    example: { type: "order", data: { id: 123, amount: 99.99 } },
  }),
});

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
export type Tenant = z.infer<typeof TenantSchema>;
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
export type UpdateConcurrencyInput = z.infer<typeof UpdateConcurrencySchema>;
export type PublishMessageInput = z.infer<typeof PublishMessageSchema>;
