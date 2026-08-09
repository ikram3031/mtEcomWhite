import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const developerRouter = Router();

// Developer verification middleware (Hardcoded for ikramul.web@gmail.com)
const verifyDeveloperAccess = (req, res, next) => {
  const userEmail = req.user?.email ? String(req.user.email).toLowerCase().trim() : "";
  if (userEmail !== "ikramul.web@gmail.com") {
    return res.status(403).json({
      status: "error",
      message: "Forbidden: Access restricted strictly to developer (ikramul.web@gmail.com).",
    });
  }
  next();
};

// In-memory buffer of recent logs for SSE & polling
export const recentLogsBuffer = [];
export const logClients = new Set();

export function broadcastLogToClients(logEntry) {
  recentLogsBuffer.push(logEntry);
  if (recentLogsBuffer.length > 300) {
    recentLogsBuffer.shift();
  }
  for (const clientRes of logClients) {
    clientRes.write(`data: ${JSON.stringify(logEntry)}\n\n`);
  }
}

// GET /api/v1/developer/logs (Polling JSON fallback)
developerRouter.get(
  "/logs",
  authenticateToken,
  verifyDeveloperAccess,
  (req, res) => {
    return res.json({
      status: "success",
      data: recentLogsBuffer,
    });
  }
);

// GET /api/v1/developer/logs/stream (Realtime SSE Stream)
developerRouter.get(
  "/logs/stream",
  authenticateToken,
  verifyDeveloperAccess,
  (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Send initial buffer
    res.write(`data: ${JSON.stringify({ type: "INIT", logs: recentLogsBuffer })}\n\n`);

    logClients.add(res);

    req.on("close", () => {
      logClients.delete(res);
    });
  }
);

// GET /api/v1/developer/docs (Scalar API Reference View - Stripe/Vercel Style)
developerRouter.get(
  "/docs",
  (req, res) => {
    const openApiSpec = {
      openapi: "3.0.0",
      info: {
        title: "Decantre BD Fullstack API Specification",
        description: "Modern, high-performance API Reference & Live Endpoint Tester for Decantre BD Backend.",
        version: "2.0.1"
      },
      servers: [
        { url: "https://server.decantrebd.com/api/v1", description: "Live Server" },
        { url: "http://localhost:5092/api/v1", description: "Local Development" }
      ],
      paths: {
        "/orders/new-order": {
          post: {
            tags: ["Orders"],
            summary: "Create New Customer Checkout Order",
            description: "Submits a new order payload and dispatches email notifications to store administrators and customer.",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["fullName", "email", "phone", "address", "district", "subtotal", "totalAmount", "paymentMethod", "items"],
                    properties: {
                      fullName: { type: "string", example: "Saad Azad" },
                      email: { type: "string", example: "saadazad97@gmail.com" },
                      phone: { type: "string", example: "01712345678" },
                      address: { type: "string", example: "House 45, Road 11, Sector 4" },
                      district: { type: "string", example: "Dhaka" },
                      shippingFee: { type: "number", example: 100 },
                      subtotal: { type: "number", example: 1850 },
                      totalAmount: { type: "number", example: 1950 },
                      paymentMethod: { type: "string", example: "Cash on Delivery (COD)" },
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            productId: { type: "string", example: "66b579f18a24d5b9423c56a1" },
                            name: { type: "string", example: "Sauvage Elixir Eau De Parfum" },
                            variant: { type: "string", example: "10ml Decant" },
                            quantity: { type: "integer", example: 1 },
                            price: { type: "number", example: 1850 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            responses: {
              "201": { description: "Order created successfully" },
              "400": { description: "Invalid order payload validation error" }
            }
          }
        },
        "/products": {
          get: {
            tags: ["Products"],
            summary: "List Products with Filtering & Pagination",
            parameters: [
              { name: "page", in: "query", schema: { type: "integer", default: 1 } },
              { name: "limit", in: "query", schema: { type: "integer", default: 15 } },
              { name: "category", in: "query", schema: { type: "string" } },
              { name: "brand", in: "query", schema: { type: "string" } },
              { name: "q", in: "query", schema: { type: "string" } }
            ],
            responses: {
              "200": { description: "Paginated list of products" }
            }
          }
        },
        "/auth/login": {
          post: {
            tags: ["Authentication"],
            summary: "Authenticate Admin/User",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      email: { type: "string", example: "ikramul.web@gmail.com" },
                      password: { type: "string", example: "your_password" }
                    }
                  }
                }
              }
            },
            responses: {
              "200": { description: "JWT Access Token & User details" }
            }
          }
        }
      }
    };

    const scalarHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Decantre API Documentation (Scalar)</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; height: 100vh; overflow: hidden; }
  </style>
</head>
<body>
  <script id="api-reference" type="application/json">
    ${JSON.stringify(openApiSpec)}
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(scalarHtml);
  }
);

export default developerRouter;
