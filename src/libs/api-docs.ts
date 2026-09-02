import express from "express";
import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { config } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express SaaS Boilerplate API",
      version: "1.0.0",
      description:
        "Production-ready, strictly-typed Express.js SaaS backend API documentation with full OpenAPI 3.0 specification.",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: `${config.APP_HOST}:${config.APP_PORT}`,
        description: "Current Environment Server",
      },
    ],
    tags: [
      { name: "Health", description: "Health checks & system status" },
      {
        name: "Auth",
        description: "Authentication, OAuth2, and session management",
      },
      { name: "Users", description: "User administration and profile data" },
      {
        name: "Payments",
        description: "Checkout sessions and payment webhooks",
      },
      { name: "Upload", description: "Multi-provider file upload operations" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT Bearer token",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: config.COOKIE_AUTH,
          description: "Session refresh token cookie",
        },
      },
      schemas: {
        StandardSuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
          },
        },
        StandardErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_FAILED" },
                message: {
                  type: "string",
                  example: "Validation failed for one or more fields",
                },
                statusCode: { type: "number", example: 400 },
                requestId: {
                  type: "string",
                  example: "d9e84bfa-2dc0-449e-a6a9-839564c7e6c0",
                },
                details: {
                  type: "array",
                  items: { type: "object" },
                },
              },
            },
          },
        },
        SafeUser: {
          type: "object",
          properties: {
            id: { type: "string", example: "usr_ck82j9a01x" },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            fullName: { type: "string", example: "John Doe" },
            role: { type: "string", enum: ["user", "admin"], example: "user" },
            emailVerified: { type: "boolean", example: true },
            avatarUrl: {
              type: "string",
              example: "https://example.com/avatar.jpg",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuthToken: {
          type: "object",
          properties: {
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            expiresAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, "../modules/**/*.route.{ts,js}"),
    path.join(__dirname, "../modules/**/*.controller.{ts,js}"),
    "./src/modules/**/*.route.ts",
    "./src/modules/**/*.controller.ts",
    "./dist/src/modules/**/*.route.js",
    "./dist/src/modules/**/*.controller.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: express.Application) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "API Documentation | Express Boilerplate",
    }),
  );

  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
