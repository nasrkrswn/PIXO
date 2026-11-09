import type { RequestHandler } from "express";
import { jwtVerify } from "jose";
import type { Role } from "../generated/prisma/client.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const TOKEN_ISSUER = "pixo-api";
const TOKEN_AUDIENCE = "pixo-client";
const allowedRoles: readonly Role[] = ["CUSTOMER", "ADMIN", "DRIVER"];
const accessTokenSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export const authenticate: RequestHandler = async (request, _response, next) => {
  const authorization = request.headers.authorization;
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    next(new ApiError(401, "Bearer access token is required"));
    return;
  }

  try {
    const { payload } = await jwtVerify(token, accessTokenSecret, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });

    if (!payload.sub || typeof payload.role !== "string" || !allowedRoles.includes(payload.role as Role)) {
      next(new ApiError(401, "Access token is invalid"));
      return;
    }

    request.user = { id: payload.sub, role: payload.role as Role };
    next();
  } catch {
    next(new ApiError(401, "Access token is invalid or expired"));
  }
};

export function authorize(...roles: Role[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.user) {
      next(new ApiError(401, "Authentication is required"));
      return;
    }

    if (!roles.includes(request.user.role)) {
      next(new ApiError(403, "You do not have permission to access this resource"));
      return;
    }

    next();
  };
}
