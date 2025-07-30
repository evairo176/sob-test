import { rabbitMQService } from "./rabbitmq";
import { messageService } from "./message-service";

interface TenantConsumer {
  tenantId: string;
  consumerTag: string;
  workers: number;
  isActive: boolean;
  workerPool: WorkerPool;
}

class WorkerPool {
  private workers: number;
  private messageQueue: any[] = [];
  private processing = false;

  constructor(
    private tenantId: string,
    workers: number
  ) {
    this.workers = workers;
  }

  async processMessage(message: any): Promise<void> {
    // Store message in database
    await messageService.createMessage(this.tenantId, message);
    console.log(`✅ Processed message for tenant ${this.tenantId}:`, message);
  }

  async addMessage(message: any): Promise<void> {
    console.log(
      `📥 Adding message to worker pool for tenant ${this.tenantId}:`,
      message
    );
    this.messageQueue.push(message);
    if (!this.processing) {
      console.log(`🔄 Starting message processing for tenant ${this.tenantId}`);
      this.startProcessing();
    }
  }

  private async startProcessing(): Promise<void> {
    this.processing = true;

    const processNext = async () => {
      if (this.messageQueue.length === 0) {
        this.processing = false;
        return;
      }

      const message = this.messageQueue.shift();
      try {
        await this.processMessage(message);
      } catch (error) {
        console.error(
          `❌ Error processing message for tenant ${this.tenantId}:`,
          error
        );
      }

      // Continue processing
      setImmediate(processNext);
    };

    // Start multiple workers
    for (let i = 0; i < this.workers; i++) {
      processNext();
    }
  }

  updateWorkers(newWorkerCount: number): void {
    this.workers = newWorkerCount;
    console.log(
      `🔧 Updated worker count for tenant ${this.tenantId} to ${newWorkerCount}`
    );
  }
}

export class TenantManager {
  private consumers: Map<string, TenantConsumer> = new Map();

  async startTenantConsumer(
    tenantId: string,
    workers: number = 3
  ): Promise<void> {
    if (this.consumers.has(tenantId)) {
      console.log(`⚠️ Consumer for tenant ${tenantId} already exists`);
      return;
    }

    try {
      // Create queue for tenant
      await rabbitMQService.createTenantQueue(tenantId);

      // Create worker pool
      const workerPool = new WorkerPool(tenantId, workers);

      // Only start consuming if RabbitMQ is connected
      if (rabbitMQService.isRabbitMQConnected()) {
        // Start consuming messages
        const channel = rabbitMQService.getChannel();
        const queueName = `tenant_${tenantId}_queue`;

        const { consumerTag } = await channel.consume(
          queueName,
          async (msg) => {
            if (msg) {
              try {
                console.log(
                  `📨 Received message for tenant ${tenantId}:`,
                  msg.content.toString()
                );
                const message = JSON.parse(msg.content.toString());
                await workerPool.addMessage(message);
                channel.ack(msg);
                console.log(`✅ Message acknowledged for tenant ${tenantId}`);
              } catch (error) {
                console.error(
                  `❌ Error parsing message for tenant ${tenantId}:`,
                  error
                );
                channel.nack(msg, false, false); // Reject and don't requeue
              }
            } else {
              console.log(`⚠️ Received null message for tenant ${tenantId}`);
            }
          },
          {
            consumerTag: `consumer_${tenantId}_${Date.now()}`,
          }
        );

        // Store consumer info
        this.consumers.set(tenantId, {
          tenantId,
          consumerTag: consumerTag!,
          workers,
          isActive: true,
          workerPool,
        });

        console.log(
          `🚀 Started RabbitMQ consumer for tenant ${tenantId} with ${workers} workers (consumerTag: ${consumerTag})`
        );
      } else {
        // Store consumer info without RabbitMQ consumer
        this.consumers.set(tenantId, {
          tenantId,
          consumerTag: `mock_consumer_${tenantId}_${Date.now()}`,
          workers,
          isActive: true,
          workerPool,
        });

        console.log(
          `🚀 Started mock consumer for tenant ${tenantId} with ${workers} workers (RabbitMQ not connected)`
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to start consumer for tenant ${tenantId}:`,
        error
      );
      throw error;
    }
  }

  async stopTenantConsumer(tenantId: string): Promise<void> {
    const consumer = this.consumers.get(tenantId);
    if (!consumer) {
      console.log(`⚠️ No consumer found for tenant ${tenantId}`);
      return;
    }

    try {
      // Only cancel consumer if RabbitMQ is connected
      if (rabbitMQService.isRabbitMQConnected()) {
        // Cancel consumer
        const channel = rabbitMQService.getChannel();
        await channel.cancel(consumer.consumerTag);

        // Delete queue
        await rabbitMQService.deleteTenantQueue(tenantId);
      }

      // Remove from active consumers
      this.consumers.delete(tenantId);

      console.log(`🛑 Stopped consumer for tenant ${tenantId}`);
    } catch (error) {
      console.error(
        `❌ Failed to stop consumer for tenant ${tenantId}:`,
        error
      );
      // Still remove from consumers even if RabbitMQ operations fail
      this.consumers.delete(tenantId);
    }
  }

  async updateTenantConcurrency(
    tenantId: string,
    workers: number
  ): Promise<void> {
    const consumer = this.consumers.get(tenantId);
    if (!consumer) {
      throw new Error(`Consumer for tenant ${tenantId} not found`);
    }

    consumer.workers = workers;
    consumer.workerPool.updateWorkers(workers);

    console.log(
      `🔧 Updated concurrency for tenant ${tenantId} to ${workers} workers`
    );
  }

  getTenantConsumer(tenantId: string): TenantConsumer | undefined {
    return this.consumers.get(tenantId);
  }

  getAllActiveTenants(): string[] {
    return Array.from(this.consumers.keys());
  }

  getConsumerStatus(tenantId: string): any {
    const consumer = this.consumers.get(tenantId);
    if (!consumer) {
      return null;
    }

    return {
      tenantId: consumer.tenantId,
      consumerTag: consumer.consumerTag,
      workers: consumer.workers,
      isActive: consumer.isActive,
      isRabbitMQConnected: rabbitMQService.isRabbitMQConnected(),
    };
  }

  getAllConsumersStatus(): any[] {
    return Array.from(this.consumers.values()).map((consumer) => ({
      tenantId: consumer.tenantId,
      consumerTag: consumer.consumerTag,
      workers: consumer.workers,
      isActive: consumer.isActive,
      isRabbitMQConnected: rabbitMQService.isRabbitMQConnected(),
    }));
  }

  async shutdown(): Promise<void> {
    console.log("🛑 Shutting down all tenant consumers...");

    const shutdownPromises = Array.from(this.consumers.keys()).map((tenantId) =>
      this.stopTenantConsumer(tenantId)
    );

    await Promise.all(shutdownPromises);
    console.log("✅ All tenant consumers shut down");
  }
}

export const tenantManager = new TenantManager();
