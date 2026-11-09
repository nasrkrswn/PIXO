import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { SignJWT } from "jose";
import type { User } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const BCRYPT_COST = 12;
const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_ISSUER = "pixo-api";
const TOKEN_AUDIENCE = "pixo-client";

export type PublicUser = Pick<User, "id" | "name" | "email" | "role" | "phone" | "createdAt">;

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  createdAt: true,
} as const;

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function createAccessToken(user: PublicUser): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(secret);
}

async function createSession(user: PublicUser): Promise<AuthSession> {
  const refreshToken = randomBytes(48).toString("base64url");

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { user, accessToken: await createAccessToken(user), refreshToken };
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const passwordHash = await hash(input.password, BCRYPT_COST);

  let user: PublicUser;
  try {
    user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        phone: input.phone ?? null,
        // Public registration must never allow a caller to choose a privileged role.
        role: "CUSTOMER",
      },
      select: publicUserSelect,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, "An account with this email already exists");
    }
    throw error;
  }

  return createSession(user);
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const userRecord = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, passwordHash: true },
  });

  if (!userRecord || !(await compare(input.password, userRecord.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { passwordHash: _passwordHash, ...user } = userRecord;
  return createSession(user);
}

export async function refreshSession(rawToken: string): Promise<AuthSession> {
  const tokenHash = hashRefreshToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: publicUserSelect } },
  });
  const now = new Date();

  if (!existing || existing.revokedAt || existing.expiresAt <= now) {
    throw new ApiError(401, "Refresh token is invalid or expired");
  }

  const refreshToken = randomBytes(48).toString("base64url");
  const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);

  // Consume the old token and create its replacement atomically.
  await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    });

    if (consumed.count !== 1) {
      throw new ApiError(401, "Refresh token is invalid or expired");
    }

    await transaction.refreshToken.create({
      data: { userId: existing.userId, tokenHash: hashRefreshToken(refreshToken), expiresAt },
    });
  });

  return {
    user: existing.user,
    accessToken: await createAccessToken(existing.user),
    refreshToken,
  };
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
