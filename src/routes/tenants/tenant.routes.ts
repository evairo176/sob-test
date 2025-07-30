import { IRouter, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { validateRequest } from "../../lib/validation";
import { createRoute } from "../../lib/create-route";
import {
  TenantSchema,
  CreateTenantSchema,
  UpdateTenantSchema,
  UpdateConcurrencySchema,
  PublishMessageSchema,
  IdParamSchema,
  ErrorSchema,
  MessageSchema,
} from "./tenant.schema";
import * as handlers from "./tenant.handlers";

const router: IRouter = Router();

// Routes
router.get("/", handlers.listTenants);
router.post(
  "/",
  validateRequest({ body: CreateTenantSchema }),
  handlers.createTenant
);
router.get(
  "/:id",
  validateRequest({ params: IdParamSchema }),
  handlers.getTenant
);
router.put(
  "/:id",
  validateRequest({ params: IdParamSchema, body: UpdateTenantSchema }),
  handlers.updateTenant
);
router.delete(
  "/:id",
  validateRequest({ params: IdParamSchema }),
  handlers.deleteTenant
);
router.put(
  "/:id/config/concurrency",
  validateRequest({ params: IdParamSchema, body: UpdateConcurrencySchema }),
  handlers.updateTenantConcurrency
);
router.post(
  "/:id/messages",
  validateRequest({ params: IdParamSchema, body: PublishMessageSchema }),
  handlers.publishMessage
);

// Debug endpoints
router.get(
  "/:id/consumer-status",
  validateRequest({ params: IdParamSchema }),
  handlers.getConsumerStatus
);

router.get("/debug/consumers", handlers.getAllConsumersStatus);

// OpenAPI definitions
export const tenantsOpenAPI = [
  createRoute({
    method: "get",
    path: "/api/tenants",
    tags: ["Tenants"],
    summary: "List all tenants",
    responses: {
      [StatusCodes.OK]: {
        description: "List of tenants",
        content: { "application/json": { schema: TenantSchema.array() } },
      },
      [StatusCodes.INTERNAL_SERVER_ERROR]: {
        description: "Server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),

  createRoute({
    method: "post",
    path: "/api/tenants",
    tags: ["Tenants"],
    summary: "Create a new tenant",
    request: {
      body: {
        content: { "application/json": { schema: CreateTenantSchema } },
        description: "Tenant data",
      },
    },
    responses: {
      [StatusCodes.CREATED]: {
        description: "Tenant created",
        content: { "application/json": { schema: TenantSchema } },
      },
      [StatusCodes.UNPROCESSABLE_ENTITY]: {
        description: "Validation error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),

  createRoute({
    method: "get",
    path: "/api/tenants/{id}",
    tags: ["Tenants"],
    summary: "Get a tenant by ID",
    request: { params: IdParamSchema },
    responses: {
      [StatusCodes.OK]: {
        description: "Tenant found",
        content: { "application/json": { schema: TenantSchema } },
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Tenant not found",
        content: { "application/json": { schema: MessageSchema } },
      },
    },
  }),

  createRoute({
    method: "put",
    path: "/api/tenants/{id}",
    tags: ["Tenants"],
    summary: "Update a tenant",
    request: {
      params: IdParamSchema,
      body: {
        content: { "application/json": { schema: UpdateTenantSchema } },
        description: "Tenant updates",
      },
    },
    responses: {
      [StatusCodes.OK]: {
        description: "Tenant updated",
        content: { "application/json": { schema: TenantSchema } },
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Tenant not found",
        content: { "application/json": { schema: MessageSchema } },
      },
    },
  }),

  createRoute({
    method: "delete",
    path: "/api/tenants/{id}",
    tags: ["Tenants"],
    summary: "Delete a tenant",
    request: { params: IdParamSchema },
    responses: {
      [StatusCodes.NO_CONTENT]: {
        description: "Tenant deleted",
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Tenant not found",
        content: { "application/json": { schema: MessageSchema } },
      },
    },
  }),

  createRoute({
    method: "put",
    path: "/api/tenants/{id}/config/concurrency",
    tags: ["Tenants"],
    summary: "Update tenant concurrency",
    request: {
      params: IdParamSchema,
      body: {
        content: { "application/json": { schema: UpdateConcurrencySchema } },
        description: "Concurrency settings",
      },
    },
    responses: {
      [StatusCodes.OK]: {
        description: "Concurrency updated",
        content: { "application/json": { schema: TenantSchema } },
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Tenant not found",
        content: { "application/json": { schema: MessageSchema } },
      },
    },
  }),

  createRoute({
    method: "post",
    path: "/api/tenants/{id}/messages",
    tags: ["Messages"],
    summary: "Publish message to tenant queue",
    request: {
      params: IdParamSchema,
      body: {
        content: { "application/json": { schema: PublishMessageSchema } },
        description: "Message to publish",
      },
    },
    responses: {
      [StatusCodes.ACCEPTED]: {
        description: "Message published",
        content: { "application/json": { schema: MessageSchema } },
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Tenant not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
];

export default router;
