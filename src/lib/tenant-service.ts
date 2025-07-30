import { db } from "../db/db";
import { tenantManager } from "./tenant-manager";
import { messageService } from "./message-service";
import env from "../env";

export class TenantService {
  async createTenant(name: string, workers?: number): Promise<any> {
    const workerCount = workers || env.DEFAULT_WORKERS;

    const tenant = await db.tenant.create({
      data: {
        name,
        workers: workerCount,
        isActive: true,
      },
    });

    console.log(`🏗️ Created tenant ${tenant.id}, starting consumer...`);

    try {
      // Start consumer for the new tenant
      await tenantManager.startTenantConsumer(tenant.id, workerCount);
      console.log(`✅ Consumer started successfully for tenant ${tenant.id}`);
    } catch (error) {
      console.error(
        `❌ Failed to start consumer for tenant ${tenant.id}:`,
        error
      );
      // Don't fail tenant creation if consumer fails to start
      // Consumer can be started later
    }

    return tenant;
  }

  async getTenant(id: string): Promise<any | null> {
    console.log(id);
    return await db.tenant.findFirst({
      where: { id },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async getAllTenants(): Promise<any[]> {
    return await db.tenant.findMany({
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateTenant(
    id: string,
    data: { name?: string; workers?: number }
  ): Promise<any> {
    const tenant = await db.tenant.update({
      where: { id },
      data,
    });

    // Update consumer concurrency if workers changed
    if (data.workers !== undefined) {
      await tenantManager.updateTenantConcurrency(id, data.workers);
    }

    return tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    // Stop consumer first
    await tenantManager.stopTenantConsumer(id);

    // Delete all messages for this tenant
    await messageService.deleteMessagesByTenant(id);

    // Delete tenant
    await db.tenant.delete({
      where: { id },
    });
  }

  async updateTenantConcurrency(id: string, workers: number): Promise<any> {
    console.log(`🔧 Updating tenant ${id} concurrency to ${workers} workers`);

    // First update the database
    const tenant = await db.tenant.update({
      where: { id },
      data: { workers },
    });

    try {
      // Check if consumer exists, if not, start it
      const consumer = tenantManager.getTenantConsumer(id);
      if (!consumer) {
        console.log(
          `⚠️ Consumer not found for tenant ${id}, starting new consumer...`
        );
        await tenantManager.startTenantConsumer(id, workers);
      } else {
        // Update existing consumer
        await tenantManager.updateTenantConcurrency(id, workers);
      }
      console.log(`✅ Successfully updated concurrency for tenant ${id}`);
    } catch (error) {
      console.error(
        `❌ Failed to update consumer concurrency for tenant ${id}:`,
        error
      );
      // Try to start a new consumer if update failed
      try {
        console.log(`🔄 Attempting to restart consumer for tenant ${id}...`);
        await tenantManager.startTenantConsumer(id, workers);
      } catch (restartError) {
        console.error(
          `❌ Failed to restart consumer for tenant ${id}:`,
          restartError
        );
      }
    }

    return tenant;
  }

  async getTenantStatus(id: string): Promise<{
    tenant: any;
    consumerActive: boolean;
    messageCount: number;
  }> {
    const tenant = await this.getTenant(id);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const consumerActive = tenantManager.getTenantConsumer(id) !== undefined;
    const messageCount = tenant._count.messages;

    return {
      tenant,
      consumerActive,
      messageCount,
    };
  }
}

export const tenantService = new TenantService();
