import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function shouldUseSupabasePooler(url: URL) {
  return (
    process.env.VERCEL === "1" &&
    url.hostname.startsWith("db.") &&
    url.hostname.endsWith(".supabase.co") &&
    (url.port === "" || url.port === "5432") &&
    !url.searchParams.has("pgbouncer")
  );
}

function deriveSupabasePoolerUrl(url: URL) {
  const pooledUrl = new URL(url.toString());

  // Supabase recommends transaction mode for serverless runtimes. Prisma also
  // needs prepared statements disabled behind PgBouncer/Supavisor.
  pooledUrl.port = "6543";
  pooledUrl.searchParams.set("pgbouncer", "true");

  if (!pooledUrl.searchParams.has("connection_limit")) {
    pooledUrl.searchParams.set("connection_limit", "1");
  }

  return pooledUrl.toString();
}

function getRuntimeDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma Client.");
  }

  try {
    const parsedUrl = new URL(rawUrl);

    if (shouldUseSupabasePooler(parsedUrl)) {
      return deriveSupabasePoolerUrl(parsedUrl);
    }
  } catch {
    // Leave malformed URLs untouched so Prisma surfaces the real error.
  }

  return rawUrl;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: getRuntimeDatabaseUrl(),
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
