// Test setup file
import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.test" });

// Set test environment
process.env.NODE_ENV = "test";

// Increase timeout for integration tests
jest.setTimeout(30000);
