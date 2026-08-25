import { PrismaClient } from '@prisma/client';
import path from 'path';

const getDatabaseUrl = (): string => {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith('file:')) {
    const filePath = envUrl.replace(/^file:/, '');
    if (path.isAbsolute(filePath)) {
      return envUrl;
    }
    const cleanPath = filePath.replace(/^\.\//, '');
    if (cleanPath.startsWith('prisma/')) {
      return `file:${path.resolve(process.cwd(), cleanPath)}`;
    }
    return `file:${path.resolve(process.cwd(), 'prisma', cleanPath)}`;
  }
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }
  return `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`;
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