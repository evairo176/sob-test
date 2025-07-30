import { StatusCodes } from "http-status-codes";
import type { AppHandler } from "../../lib/types";
import { messageService } from "../../lib/message-service";

export const getMessages: AppHandler = async (req, res) => {
  try {
    const { tenant_id, cursor, limit } = req.query as any;

    if (!tenant_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "tenant_id is required",
      });
    }

    const result = await messageService.getMessages(tenant_id, cursor, limit);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    console.error("Error getting messages:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch messages",
    });
  }
};

export const getMessagesByTenant: AppHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const messages = await messageService.getMessagesByTenant(tenantId);
    return res.status(StatusCodes.OK).json(messages);
  } catch (error) {
    console.error("Error getting messages by tenant:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch messages",
    });
  }
};
