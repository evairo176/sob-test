import { IRouter, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { validateRequest } from "../../lib/validation";
import { createRoute } from "../../lib/create-route";
import {
  MessageSchema,
  GetMessagesQuerySchema,
  TenantIdParamSchema,
  PaginatedMessagesSchema,
  ErrorSchema,
} from "./message.schema";
import * as handlers from "./message.handlers";

const router: IRouter = Router();

// Routes
router.get(
  "/",
  validateRequest({ query: GetMessagesQuerySchema }),
  handlers.getMessages
);
router.get(
  "/tenant/:tenantId",
  validateRequest({ params: TenantIdParamSchema }),
  handlers.getMessagesByTenant
);

// OpenAPI definitions
export const messagesOpenAPI = [
  createRoute({
    method: "get",
    path: "/api/messages",
    tags: ["Messages"],
    summary: "Get messages with cursor pagination",
    request: { query: GetMessagesQuerySchema },
    responses: {
      [StatusCodes.OK]: {
        description: "Paginated messages",
        content: { "application/json": { schema: PaginatedMessagesSchema } },
      },
      [StatusCodes.BAD_REQUEST]: {
        description: "Bad request",
        content: { "application/json": { schema: ErrorSchema } },
      },
      [StatusCodes.INTERNAL_SERVER_ERROR]: {
        description: "Server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),

  createRoute({
    method: "get",
    path: "/api/messages/tenant/{tenantId}",
    tags: ["Messages"],
    summary: "Get all messages for a tenant",
    request: { params: TenantIdParamSchema },
    responses: {
      [StatusCodes.OK]: {
        description: "List of messages for the tenant",
        content: { "application/json": { schema: MessageSchema.array() } },
      },
      [StatusCodes.INTERNAL_SERVER_ERROR]: {
        description: "Server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
];

export default router;
