import { StatusCodes } from "http-status-codes";
import { db } from "../../db/db";
import type { AppHandler } from "../../lib/types";
import { tenantService } from "../../lib/tenant-service";
import { rabbitMQService } from "../../lib/rabbitmq";

export const listTenants: AppHandler = async (req, res) => {
  try {
    const tenants = await tenantService.getAllTenants();
    return res.status(StatusCodes.OK).json(tenants);
  } catch (error) {
    console.error("Error listing tenants:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch tenants",
    });
  }
};

export const createTenant: AppHandler = async (req, res) => {
  try {
    const { name, workers } = req.body;
    const tenant = await tenantService.createTenant(name, workers);
    return res.status(StatusCodes.CREATED).json(tenant);
  } catch (error) {
    console.error("Error creating tenant:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to create tenant",
    });
  }
};

export const getTenant: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await tenantService.getTenantStatus(id);
    return res.status(StatusCodes.OK).json(status);
  } catch (error) {
    console.error("Error getting tenant:", error);
    if (error instanceof Error && error.message === "Tenant not found") {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Tenant not found",
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch tenant",
    });
  }
};

export const updateTenant: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const tenant = await tenantService.updateTenant(id, data);
    return res.status(StatusCodes.OK).json(tenant);
  } catch (error) {
    console.error("Error updating tenant:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to update tenant",
    });
  }
};

export const deleteTenant: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tenant exists
    const existingTenant = await db.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Tenant not found",
      });
    }

    await tenantService.deleteTenant(id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to delete tenant",
    });
  }
};

export const updateTenantConcurrency: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { workers } = req.body;

    const tenant = await tenantService.updateTenantConcurrency(id, workers);
    return res.status(StatusCodes.OK).json(tenant);
  } catch (error) {
    console.error("Error updating tenant concurrency:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Tenant not found",
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to update tenant concurrency",
    });
  }
};

export const publishMessage: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { payload } = req.body;

    // Verify tenant exists
    const tenant = await tenantService.getTenant(id);
    if (!tenant) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Tenant not found",
      });
    }

    await rabbitMQService.publishMessage(id, payload);
    return res.status(StatusCodes.ACCEPTED).json({
      message: "Message published successfully",
    });
  } catch (error) {
    console.error("Error publishing message:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to publish message",
    });
  }
};
export const getConsumerStatus: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Import tenantManager here to avoid circular dependency
    const { tenantManager } = await import("../../lib/tenant-manager");
    const status = tenantManager.getConsumerStatus(id);

    if (!status) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Consumer not found for this tenant",
      });
    }

    return res.status(StatusCodes.OK).json(status);
  } catch (error) {
    console.error("Error getting consumer status:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to get consumer status",
    });
  }
};

export const getAllConsumersStatus: AppHandler = async (req, res) => {
  try {
    // Import tenantManager here to avoid circular dependency
    const { tenantManager } = await import("../../lib/tenant-manager");
    const consumers = tenantManager.getAllConsumersStatus();

    return res.status(StatusCodes.OK).json({
      consumers,
      totalConsumers: consumers.length,
    });
  } catch (error) {
    console.error("Error getting all consumers status:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to get consumers status",
    });
  }
};
