import { PrismaClient } from '@prisma/client';
import path from 'path';

const getDatabaseUrl = (): string => {
  let envUrl = (process.env.DATABASE_URL || '').trim();

  // If empty or missing, fallback to default absolute path
  if (!envUrl) {
    return `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`;
  }

  // If remote database connection string (Postgres, MySQL, etc.)
  if (
    envUrl.startsWith('postgresql://') ||
    envUrl.startsWith('postgres://') ||
    envUrl.startsWith('mysql://') ||
    envUrl.startsWith('mongodb://')
  ) {
    return envUrl;
  }

  // Ensure 'file:' prefix is present for SQLite
  if (!envUrl.startsWith('file:')) {
    envUrl = `file:${envUrl}`;
  }

  const filePath = envUrl.replace(/^file:/, '');

  // If absolute path (e.g. file:/app/prisma/dev.db or file:/tmp/dev.db)
  if (path.isAbsolute(filePath)) {
    return `file:${filePath}`;
  }

  // If relative path (e.g. file:./prisma/dev.db or file:dev.db)
  const cleanPath = filePath.replace(/^\.\//, '');
  if (cleanPath.startsWith('prisma/')) {
    return `file:${path.resolve(process.cwd(), cleanPath)}`;
  }
  return `file:${path.resolve(process.cwd(), 'prisma', cleanPath)}`;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;