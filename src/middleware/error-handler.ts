import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    // Do not echo submitted input values, which can include passwords.
    const details = error.issues.map(({ code, message, path }) => ({ code, message, path }));
    res.status(400).json({ error: "Validation failed", details });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  // Return a safe, actionable message for common Prisma connection/schema failures.
  const prismaCode = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
  const errorName = error instanceof Error ? error.name : "";
  const databaseSetupCodes = new Set(["P1000", "P1001", "P1003", "P1008", "P1010", "P1011", "P1017", "P2021", "P2022"]);
  if (databaseSetupCodes.has(prismaCode ?? "") || errorName === "PrismaClientInitializationError") {
    console.error(error);
    res.status(503).json({ error: "Database is unavailable or not initialized. Configure DATABASE_URL and apply Prisma migrations." });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};
