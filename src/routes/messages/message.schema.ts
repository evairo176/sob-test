import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { RouteParameter } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

export const MessageSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier for the message",
    example: "clq123abc456def789",
  }),
  tenantId: z.string().openapi({
    description: "ID of the tenant that owns this message",
    example: "clq123abc456def789",
  }),
  payload: z.any().openapi({
    description: "Message payload",
    example: { type: "order", data: { id: 123, amount: 99.99 } },
  }),
  createdAt: z.date().openapi({
    description: "Date when the message was created",
  }),
});

export const GetMessagesQuerySchema = z.object({
  tenant_id: z.string().min(1, "tenant_id is required").openapi({
    description: "Tenant ID to filter messages",
    example: "clq123abc456def789",
  }),
  cursor: z.string().optional().openapi({
    description: "Cursor for pagination",
    example: "clq123abc456def789",
  }),
  limit: z.coerce.number().min(1).max(100).default(20).openapi({
    description: "Number of messages to return",
    example: 20,
  }),
});

export const TenantIdParamSchema: RouteParameter = z.object({
  tenantId: z
    .string()
    .min(1, "Invalid tenant ID format")
    .openapi({
      description: "Tenant ID",
      example: "clq123abc456def789",
      param: { name: "tenantId", in: "path" },
    }),
});

export const PaginatedMessagesSchema = z.object({
  data: MessageSchema.array().openapi({
    description: "Array of messages",
  }),
  nextCursor: z.string().optional().openapi({
    description: "Cursor for the next page of results",
    example: "clq123abc456def789",
  }),
});

// Common response schemas
export const ErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.array(z.any()).optional(),
});

// Types
export type Message = z.infer<typeof MessageSchema>;
export type GetMessagesQuery = z.infer<typeof GetMessagesQuerySchema>;
export type PaginatedMessages = z.infer<typeof PaginatedMessagesSchema>;
