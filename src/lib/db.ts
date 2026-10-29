import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
}

function getClient(): PrismaClient {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured. Prisma operations are unavailable.");
  }

  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL!;
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
    const adapter = new PrismaNeon(pool as unknown as ConstructorParameters<typeof PrismaNeon>[0]);

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }

  return globalForPrisma.prisma;
}

/**
 * Lazily-connected Prisma client. Importing it never throws, so pages can
 * render (with graceful fallbacks) when the database isn't configured.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === "then") return undefined;
    if (!isDatabaseConfigured()) return undefined;
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});