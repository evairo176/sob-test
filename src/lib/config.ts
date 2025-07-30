import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

interface AppConfig {
  rabbitmq: {
    url: string;
  };
  database: {
    url: string;
  };
  workers: number;
  server: {
    port: number;
  };
}

const CONFIG_PATH = join(process.cwd(), "config.yaml");

const defaultConfig: AppConfig = {
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  },
  database: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/app",
  },
  workers: parseInt(process.env.DEFAULT_WORKERS || "3"),
  server: {
    port: parseInt(process.env.PORT || "5000"),
  },
};

export class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    if (existsSync(CONFIG_PATH)) {
      try {
        const fileContent = readFileSync(CONFIG_PATH, "utf8");
        const yamlConfig = yaml.load(fileContent) as Partial<AppConfig>;
        return { ...defaultConfig, ...yamlConfig };
      } catch (error) {
        console.warn("⚠️ Failed to load config.yaml, using defaults:", error);
        return defaultConfig;
      }
    }

    // Create default config file
    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  private saveConfig(config: AppConfig): void {
    try {
      const yamlContent = yaml.dump(config, { indent: 2 });
      writeFileSync(CONFIG_PATH, yamlContent, "utf8");
    } catch (error) {
      console.error("❌ Failed to save config.yaml:", error);
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig(this.config);
  }

  getRabbitMQUrl(): string {
    return this.config.rabbitmq.url;
  }

  getDatabaseUrl(): string {
    return this.config.database.url;
  }

  getDefaultWorkers(): number {
    return this.config.workers;
  }

  getServerPort(): number {
    return this.config.server.port;
  }
}

export const configService = new ConfigService();
