import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
}

function getClient(): PrismaClient {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is missing or empty.");
  }

  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL!;
    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    const adapter = new PrismaNeon(pool as unknown as ConstructorParameters<typeof PrismaNeon>[0]);

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === "then") return undefined;
    if (!isDatabaseConfigured()) {
      return () => Promise.reject(new Error("DATABASE_URL is not configured in Vercel environment."));
    }
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});