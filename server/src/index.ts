import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { registerRoutes } from "./routes/index.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

const app = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV === "development" ? { target: "pino-pretty", options: { colorize: true } } : undefined,
  },
});

async function start() {
  await app.register(cors, { origin: config.CORS_ORIGINS, credentials: true });
  await app.register(websocket);
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    mode: config.APP_MODE,
    mockMode: config.APP_MODE === "local",
  }));

  await registerRoutes(app);

  try {
    await app.listen({ port: config.PORT, host: "0.0.0.0" });
    logger.info(`ARYNOX AI HIRE Server running on http://localhost:${config.PORT}`);
    logger.info(`API docs: http://localhost:${config.PORT}/docs`);
    logger.info(`Health: http://localhost:${config.PORT}/health`);
    logger.info(`Mode: ${config.APP_MODE}${config.APP_MODE === "local" ? " (MOCK MODE)" : ""}`);
  } catch (err) {
    logger.error(err, "Failed to start server");
    process.exit(1);
  }
}

start();
