import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { getServerEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb() {
  if (!globalForPrisma.prisma) {
    const { DATABASE_URL } = getServerEnv();
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString: DATABASE_URL }),
    });
  }
  return globalForPrisma.prisma;
}
