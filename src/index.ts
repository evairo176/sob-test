import app from "./app";
import env from "./env";
import { rabbitMQService } from "./lib/rabbitmq";
import { gracefulShutdown } from "./lib/graceful-shutdown";

const port = env.PORT;

async function startServer() {
  try {
    // Initialize RabbitMQ connection (optional in development)
    console.log("🔌 Connecting to RabbitMQ...");
    await rabbitMQService.connect();

    // Start HTTP server
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(
        `📚 API Documentation available at http://localhost:${port}/docs`
      );
      console.log(
        `🔧 OpenAPI spec available at http://localhost:${port}/docs/openapi.json`
      );

      if (rabbitMQService.isRabbitMQConnected()) {
        console.log("✅ RabbitMQ features are available");
      } else {
        console.log(
          "⚠️ RabbitMQ features are disabled (running in development mode)"
        );
      }
    });

    // Set up graceful shutdown
    gracefulShutdown.setServer(server);
    gracefulShutdown.setupSignalHandlers();

    // Test your endpoints
    console.log("🧪 Test your API:");
    console.log(`curl http://localhost:${port}/api/products`);
    console.log(`curl http://localhost:${port}/api/tenants`);
    console.log(`curl http://localhost:${port}/health`);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
