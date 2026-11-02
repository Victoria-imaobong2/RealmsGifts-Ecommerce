import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
}

/** Cleans common paste mistakes: surrounding quotes/whitespace, a `psql '...'` wrapper, and SQLAlchemy-style `+driver` schemes. */
function normalizeConnectionString(raw: string): string {
  const url = raw.match(/postgres(?:ql)?(?:\+\w+)?:\/\/[^\s'"]+/i)?.[0] ?? raw.trim();
  return url.replace(/^(postgres(?:ql)?)\+\w+:\/\//i, "$1://");
}

function getClient(): PrismaClient {
  const rawConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!rawConnectionString) {
    throw new Error("DATABASE_URL is missing from environment variables.");
  }

  const connectionString = normalizeConnectionString(rawConnectionString);

  if (!globalForPrisma.prisma) {
    // PrismaNeonHttp takes the connection string itself (not a neon() client).
    const adapter = new PrismaNeonHttp(connectionString, {});

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
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});