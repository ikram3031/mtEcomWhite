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

// GET /api/v1/developer/docs (OpenAPI / Swagger HTML View)
developerRouter.get(
  "/docs",
  authenticateToken,
  verifyDeveloperAccess,
  (req, res) => {
    const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Decantre API Documentation (Swagger UI)</title>
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = {
        "openapi": "3.0.0",
        "info": {
          "title": "Decantre Fullstack API Specification",
          "description": "Interactive API Documentation & Endpoint Tester for Decantre BD Backend.",
          "version": "2.0.1"
        },
        "servers": [
          { "url": "/api/v1", "description": "Current Backend Environment" }
        ],
        "paths": {
          "/orders/new-order": {
            "post": {
              "summary": "Create new order from checkout",
              "requestBody": {
                "required": true,
                "content": {
                  "application/json": {
                    "example": {
                      "fullName": "Metalhead User",
                      "email": "metalhead.developer@gmail.com",
                      "phone": "01712345678",
                      "address": "House 45, Road 11",
                      "district": "Dhaka",
                      "shippingFee": 100,
                      "subtotal": 1850,
                      "totalAmount": 1950,
                      "paymentMethod": "Cash on Delivery (COD)",
                      "items": [{ "productId": "66b579f18a24d5b9423c56a1", "quantity": 1, "price": 1850 }]
                    }
                  }
                }
              },
              "responses": { "201": { "description": "Order created successfully" } }
            }
          },
          "/dashboard/products": {
            "get": {
              "summary": "List all products with pagination",
              "responses": { "200": { "description": "List of products" } }
            }
          },
          "/auth/login": {
            "post": {
              "summary": "User authentication login",
              "requestBody": {
                "required": true,
                "content": {
                  "application/json": {
                    "example": { "email": "ikramul.web@gmail.com", "password": "your_password" }
                  }
                }
              },
              "responses": { "200": { "description": "Login successful" } }
            }
          }
        }
      };

      const ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
    `;
    res.setHeader("Content-Type", "text/html");
    res.send(swaggerHtml);
  }
);

export default developerRouter;
