// src/app.ts - Add welcome route
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { apiReference } from "@scalar/express-api-reference";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";

import { html } from "./lib/constants";
import productsRouter, {
  productsOpenAPI,
} from "./routes/products/products.routes";
import tenantRouter, { tenantsOpenAPI } from "./routes/tenants/tenant.routes";
import messageRouter, {
  messagesOpenAPI,
} from "./routes/messages/message.routes";
import {
  generateOpenAPIDocument,
  registerOpenAPIRoutes,
} from "./lib/openapi-registry";
const app: Express = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Middleware - Configure Helmet to allow Scalar's requirements
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors());
app.use(limiter);
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register OpenAPI definitions
registerOpenAPIRoutes(productsOpenAPI);
registerOpenAPIRoutes(tenantsOpenAPI);
registerOpenAPIRoutes(messagesOpenAPI);
// registerOpenAPIRoutes(categoriesOpenAPI);
const openApiDocument = generateOpenAPIDocument();
app.get("/docs/openapi.json", (req, res) => {
  res.json(openApiDocument);
});

// Welcome page route
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// Serve OpenAPI spec
app.use(
  "/docs",
  apiReference({
    theme: "kepler",
    layout: "modern",
    defaultHttpClient: {
      targetKey: "js",
      clientKey: "fetch",
    },
    url: "/docs/openapi.json",
  })
);

// Routes
app.use("/api/products", productsRouter);
app.use("/api/tenants", tenantRouter);
app.use("/api/messages", messageRouter);
// app.use("/api/categories", categoriesRouter);
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});
// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
