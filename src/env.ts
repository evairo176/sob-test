import type { ZodError } from "zod";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { z } from "zod";

expand(config());

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string(),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  RABBITMQ_URL: z.string().default("amqp://localhost:5672"),
  DEFAULT_WORKERS: z.coerce.number().default(3),
});

export type env = z.infer<typeof EnvSchema>;

let env: env;

try {
  env = EnvSchema.parse(process.env);
} catch (e) {
  const error = e as ZodError;
  console.error("❌ Invalid env: ");
  console.error(error.flatten().fieldErrors);
  process.exit(1);
}

export default env;
