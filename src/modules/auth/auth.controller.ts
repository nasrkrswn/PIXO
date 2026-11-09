import type { CookieOptions, Request, RequestHandler } from "express";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { login, logout, REFRESH_TOKEN_TTL_MS, refreshSession, register } from "./auth.service.js";

const REFRESH_COOKIE_NAME = "pixo_refresh_token";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth",
  maxAge: REFRESH_TOKEN_TTL_MS,
};

function readRefreshCookie(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  const prefix = `${REFRESH_COOKIE_NAME}=`;
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!cookie) return undefined;

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return undefined;
  }
}

export const registerController: RequestHandler = async (request, response) => {
  const session = await register(registerSchema.parse(request.body));
  response.cookie(REFRESH_COOKIE_NAME, session.refreshToken, refreshCookieOptions);
  response.status(201).json({ user: session.user, accessToken: session.accessToken });
};

export const loginController: RequestHandler = async (request, response) => {
  const session = await login(loginSchema.parse(request.body));
  response.cookie(REFRESH_COOKIE_NAME, session.refreshToken, refreshCookieOptions);
  response.status(200).json({ user: session.user, accessToken: session.accessToken });
};

export const refreshController: RequestHandler = async (request, response) => {
  const refreshToken = readRefreshCookie(request);
  if (!refreshToken) throw new ApiError(401, "Refresh token is required");

  const session = await refreshSession(refreshToken);
  response.cookie(REFRESH_COOKIE_NAME, session.refreshToken, refreshCookieOptions);
  response.status(200).json({ user: session.user, accessToken: session.accessToken });
};

export const logoutController: RequestHandler = async (request, response) => {
  await logout(readRefreshCookie(request));
  response.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
  response.status(204).send();
};
