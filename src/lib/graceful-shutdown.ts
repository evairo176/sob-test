import { Server } from "http";
import { tenantManager } from "./tenant-manager";
import { rabbitMQService } from "./rabbitmq";

export class GracefulShutdown {
  private server: Server | null = null;
  private isShuttingDown = false;

  setServer(server: Server): void {
    this.server = server;
  }

  async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.log("⚠️ Shutdown already in progress...");
      return;
    }

    this.isShuttingDown = true;
    console.log(`🛑 Received ${signal}. Starting graceful shutdown...`);

    try {
      // Stop accepting new connections
      if (this.server) {
        console.log("🔌 Closing HTTP server...");
        await new Promise<void>((resolve, reject) => {
          this.server!.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log("✅ HTTP server closed");
      }

      // Shutdown tenant consumers
      console.log("🛑 Shutting down tenant consumers...");
      await tenantManager.shutdown();
      console.log("✅ Tenant consumers shut down");

      // Close RabbitMQ connection
      console.log("🔌 Closing RabbitMQ connection...");
      await rabbitMQService.close();
      console.log("✅ RabbitMQ connection closed");

      console.log("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during graceful shutdown:", error);
      process.exit(1);
    }
  }

  setupSignalHandlers(): void {
    // Handle different termination signals
    const signals = ["SIGTERM", "SIGINT", "SIGUSR2"];

    signals.forEach((signal) => {
      process.on(signal, () => {
        this.shutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      this.shutdown("uncaughtException");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      this.shutdown("unhandledRejection");
    });
  }
}

export const gracefulShutdown = new GracefulShutdown();
