import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createLogger } from "./logger";
import { registerStripeWebhook } from "../routers/stripeWebhook";
import { generateInvoicePdf, generateBatchInvoicePdf } from "../invoicePdf";

const log = createLogger("Server");

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Let Vite handle CSP in dev
    crossOriginEmbedderPolicy: false,
  }));

  // Simple rate limiter for auth endpoints
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  app.use("/api/oauth", (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (entry && entry.resetAt > now) {
      entry.count++;
      if (entry.count > 30) {
        return res.status(429).json({ error: "Too many requests" });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    }
    next();
  });

  // Stripe webhook MUST be registered before body parsers (needs raw body)
  registerStripeWebhook(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Invoice PDF download endpoint
  app.get("/api/invoice/:id/pdf", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) return res.status(400).json({ error: "Invalid invoice ID" });
      const pdfBuffer = await generateInvoicePdf(invoiceId);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="factuur-${invoiceId}.pdf"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      log.error("PDF generation failed", err);
      res.status(500).json({ error: err.message || "PDF generation failed" });
    }
  });

  app.post("/api/invoices/batch-pdf", async (req, res) => {
    try {
      const { invoiceIds } = req.body;
      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return res.status(400).json({ error: "invoiceIds array required" });
      }
      const pdfBuffer = await generateBatchInvoicePdf(invoiceIds);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="facturen-batch.pdf"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      log.error("Batch PDF generation failed", err);
      res.status(500).json({ error: err.message || "Batch PDF generation failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    log.info(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    log.info(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch((err) => log.error("Failed to start server", err));
