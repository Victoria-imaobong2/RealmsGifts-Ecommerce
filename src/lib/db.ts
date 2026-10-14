import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getClient(): PrismaClient {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured. Prisma operations are unavailable.");
  }
  globalForPrisma.prisma ??= new PrismaClient();
  return globalForPrisma.prisma;
}

/**
 * Lazily-connected Prisma client. Importing it never throws, so pages can
 * render (with graceful fallbacks) when the database isn't configured.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === "then") return undefined;
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
