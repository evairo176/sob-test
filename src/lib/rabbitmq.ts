import * as amqp from "amqplib";
import env from "../env";

export class RabbitMQService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      console.log(
        `🔌 Attempting to connect to RabbitMQ at ${env.RABBITMQ_URL}...`
      );
      this.connection = await amqp.connect(env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;

      console.log("✅ Connected to RabbitMQ successfully");

      // Handle connection errors
      this.connection.on("error", (err) => {
        console.error("❌ RabbitMQ connection error:", err.message || err);
        this.isConnected = false;
      });

      this.connection.on("close", () => {
        console.log("🔌 RabbitMQ connection closed");
        this.isConnected = false;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Failed to connect to RabbitMQ:", errorMessage);
      console.log("⚠️ Running in development mode without RabbitMQ");
      console.log(
        "💡 To enable RabbitMQ features, run: docker-compose up -d rabbitmq"
      );
      this.isConnected = false;
      // Don't throw error in development mode
      if (env.NODE_ENV === "production") {
        throw error;
      }
    }
  }

  isRabbitMQConnected(): boolean {
    return this.isConnected;
  }

  async createTenantQueue(tenantId: string): Promise<void> {
    if (!this.isConnected || !this.channel) {
      console.log(
        `⚠️ RabbitMQ not connected, skipping queue creation for tenant ${tenantId}`
      );
      return;
    }

    const queueName = `tenant_${tenantId}_queue`;
    await this.channel.assertQueue(queueName, {
      durable: true,
      autoDelete: false,
    });

    console.log(`📦 Created queue: ${queueName}`);
  }

  async deleteTenantQueue(tenantId: string): Promise<void> {
    if (!this.isConnected || !this.channel) {
      console.log(
        `⚠️ RabbitMQ not connected, skipping queue deletion for tenant ${tenantId}`
      );
      return;
    }

    const queueName = `tenant_${tenantId}_queue`;
    await this.channel.deleteQueue(queueName);

    console.log(`🗑️ Deleted queue: ${queueName}`);
  }

  async publishMessage(tenantId: string, message: any): Promise<void> {
    if (!this.isConnected || !this.channel) {
      console.log(
        `⚠️ RabbitMQ not connected, storing message directly to database for tenant ${tenantId}`
      );
      // Import messageService here to avoid circular dependency
      const { messageService } = await import("./message-service");
      await messageService.createMessage(tenantId, message);
      console.log(
        `✅ Message stored directly to database for tenant ${tenantId}`
      );
      return;
    }

    const queueName = `tenant_${tenantId}_queue`;
    const messageBuffer = Buffer.from(JSON.stringify(message));

    this.channel.sendToQueue(queueName, messageBuffer, {
      persistent: true,
    });

    console.log(`📤 Published message to ${queueName}`);
  }

  getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    return this.channel;
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    console.log("🔌 RabbitMQ connection closed");
  }
}

export const rabbitMQService = new RabbitMQService();
