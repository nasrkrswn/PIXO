import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";

const server = app.listen(env.PORT, () => {
  console.info(`PIXO API listening on http://localhost:${env.PORT}`);
});

const shutdown = async (signal: string): Promise<void> => {
  console.info(`${signal} received; shutting down PIXO API`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
