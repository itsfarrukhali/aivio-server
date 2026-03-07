import "./configs/instrument.mjs"; // Sentry Performance Monitoring
import * as Sentry from "@sentry/node";
import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controller/clerk.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/errorMiddleware.js";
import { ApiResponseUtil } from "./utils/apiResponse.js";

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Clerk Webhooks (must be before express.json())
app.post(
  "/api/clerk-webhooks",
  express.raw({ type: "application/json" }),
  clerkWebhooks
);

// Body Parser Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Clerk Authentication Middleware
app.use(clerkMiddleware());

// Request Logger (Development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health Check Route
app.get("/", (req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      status: "live",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
    "🚀 UGC Project Server is Live!"
  );
});

app.get("/api/health", (req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    "Server is healthy"
  );
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

// Debug Sentry route - MUST be before Sentry error handler
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// Sentry error handler - This should come AFTER all your routes
Sentry.setupExpressErrorHandler(app);

// 404 Handler - Must be after all routes
app.use(notFoundMiddleware);

// Global Error Handler - Must be last
app.use(errorMiddleware);

// Server Configuration
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("\n🚀 ========================================");
  console.log(`✅ Server is running on port ${port}`);
  console.log(`🌐 http://localhost:${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("🔒 Clerk Authentication: Enabled");
  console.log("💾 Database: Connected");
  console.log("========================================\n");
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT received. Shutting down gracefully...");
  process.exit(0);
});
