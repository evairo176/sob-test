import { db } from "../db/db";

export class MessageService {
  async createMessage(tenantId: string, payload: any): Promise<any> {
    return await db.message.create({
      data: {
        tenantId,
        payload,
      },
    });
  }

  async getMessages(
    tenantId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<{
    data: any[];
    nextCursor?: string;
  }> {
    const whereClause: any = { tenantId };

    if (cursor) {
      whereClause.id = {
        lt: cursor, // Use 'lt' for descending order (newer first)
      };
    }

    const messages = await db.message.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1, // Take one extra to determine if there's a next page
    });

    const hasNextPage = messages.length > limit;
    const data = hasNextPage ? messages.slice(0, -1) : messages;
    const nextCursor = hasNextPage ? data[data.length - 1].id : undefined;

    return {
      data,
      nextCursor,
    };
  }

  async getMessagesByTenant(tenantId: string): Promise<any[]> {
    return await db.message.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteMessagesByTenant(tenantId: string): Promise<void> {
    await db.message.deleteMany({
      where: { tenantId },
    });
  }
}

export const messageService = new MessageService();
