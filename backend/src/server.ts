import { createServer } from "node:http";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const app = createApp();
const server = createServer(app);
let isShuttingDown = false;

server.listen(env.PORT, () => {
  console.info(
    JSON.stringify({
      level: "info",
      event: "server_started",
      port: env.PORT,
      environment: env.NODE_ENV,
      healthUrl: `http://localhost:${env.PORT}${env.API_PREFIX}/health`,
    }),
  );
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.info(JSON.stringify({ level: "info", event: "server_stopping", signal }));

  const forceExitTimer = setTimeout(() => {
    console.error(JSON.stringify({ level: "error", event: "forced_shutdown" }));
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async (serverError) => {
    try {
      await prisma.$disconnect();
    } finally {
      clearTimeout(forceExitTimer);

      if (serverError) {
        console.error(serverError);
        process.exit(1);
      }

      process.exit(0);
    }
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error(JSON.stringify({ level: "error", event: "unhandled_rejection", reason }));
});

process.on("uncaughtException", (error) => {
  console.error(
    JSON.stringify({
      level: "error",
      event: "uncaught_exception",
      error: error.message,
      stack: error.stack,
    }),
  );
  void shutdown("SIGTERM");
});
