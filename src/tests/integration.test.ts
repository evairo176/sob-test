import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../app";
import { rabbitMQService } from "../lib/rabbitmq";
import { tenantManager } from "../lib/tenant-manager";

const prisma = new PrismaClient();

describe("Tenant Management Integration Tests", () => {
  beforeAll(async () => {
    // Initialize RabbitMQ connection for tests
    await rabbitMQService.connect();
  });

  afterAll(async () => {
    // Cleanup
    await tenantManager.shutdown();
    await rabbitMQService.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.message.deleteMany();
    await prisma.tenant.deleteMany();
  });

  describe("Tenant Lifecycle", () => {
    it("should create a new tenant", async () => {
      const response = await request(app)
        .post("/api/tenants")
        .send({
          name: "Test Tenant",
          workers: 5,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: "Test Tenant",
        workers: 5,
        isActive: true,
      });
      expect(response.body.id).toBeDefined();
    });

    it("should get all tenants", async () => {
      // Create a test tenant first
      const tenant = await prisma.tenant.create({
        data: {
          name: "Test Tenant",
          workers: 3,
        },
      });

      const response = await request(app).get("/api/tenants").expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: tenant.id,
        name: "Test Tenant",
        workers: 3,
      });
    });

    it("should get tenant by ID", async () => {
      const tenant = await prisma.tenant.create({
        data: {
          name: "Test Tenant",
          workers: 3,
        },
      });

      const response = await request(app)
        .get(`/api/tenants/${tenant.id}`)
        .expect(200);

      expect(response.body.tenant).toMatchObject({
        id: tenant.id,
        name: "Test Tenant",
      });
      expect(response.body.consumerActive).toBeDefined();
      expect(response.body.messageCount).toBeDefined();
    });

    it("should update tenant concurrency", async () => {
      // Create tenant first
      const createResponse = await request(app)
        .post("/api/tenants")
        .send({
          name: "Test Tenant",
          workers: 3,
        })
        .expect(201);

      const tenantId = createResponse.body.id;

      // Update concurrency
      const response = await request(app)
        .put(`/api/tenants/${tenantId}/config/concurrency`)
        .send({
          workers: 8,
        })
        .expect(200);

      expect(response.body.workers).toBe(8);
    });

    it("should delete a tenant", async () => {
      // Create tenant first
      const createResponse = await request(app)
        .post("/api/tenants")
        .send({
          name: "Test Tenant",
          workers: 3,
        })
        .expect(201);

      const tenantId = createResponse.body.id;

      // Delete tenant
      await request(app).delete(`/api/tenants/${tenantId}`).expect(204);

      // Verify tenant is deleted
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      expect(tenant).toBeNull();
    });
  });

  describe("Message Publishing and Consumption", () => {
    let tenantId: string;

    beforeEach(async () => {
      // Create a test tenant
      const response = await request(app)
        .post("/api/tenants")
        .send({
          name: "Message Test Tenant",
          workers: 2,
        })
        .expect(201);

      tenantId = response.body.id;
    });

    it("should publish a message to tenant queue", async () => {
      const messagePayload = {
        type: "test",
        data: { message: "Hello World" },
      };

      await request(app)
        .post(`/api/tenants/${tenantId}/messages`)
        .send({
          payload: messagePayload,
        })
        .expect(202);
    });

    it("should process and store messages", async () => {
      const messagePayload = {
        type: "test",
        data: { message: "Hello World" },
      };

      // Publish message
      await request(app)
        .post(`/api/tenants/${tenantId}/messages`)
        .send({
          payload: messagePayload,
        })
        .expect(202);

      // Wait a bit for message processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if message was stored
      const messages = await prisma.message.findMany({
        where: { tenantId },
      });

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].payload).toEqual(messagePayload);
    });

    it("should retrieve messages with cursor pagination", async () => {
      // Create some test messages
      await prisma.message.createMany({
        data: [
          { tenantId, payload: { test: 1 } },
          { tenantId, payload: { test: 2 } },
          { tenantId, payload: { test: 3 } },
        ],
      });

      const response = await request(app)
        .get(`/api/messages?tenant_id=${tenantId}&limit=2`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.nextCursor).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent tenant", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      await request(app).get(`/api/tenants/${fakeId}`).expect(404);
    });

    it("should validate request body for tenant creation", async () => {
      await request(app)
        .post("/api/tenants")
        .send({
          // Missing required name field
          workers: 5,
        })
        .expect(400);
    });

    it("should validate worker count limits", async () => {
      await request(app)
        .post("/api/tenants")
        .send({
          name: "Test Tenant",
          workers: 100, // Exceeds maximum
        })
        .expect(400);
    });
  });
});
