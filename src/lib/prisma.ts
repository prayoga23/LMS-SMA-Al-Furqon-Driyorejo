import { PrismaClient } from '@prisma/client';

const getDatabaseUrl = (): string => {
  const envUrl = (process.env.DATABASE_URL || '').trim();

  // If valid MySQL URL provided in .env
  if (envUrl.startsWith('mysql://')) {
    return envUrl;
  }

  // Fallback for MySQL local (e.g. XAMPP/Laragon/local MySQL default)
  return envUrl || 'mysql://root:@localhost:3306/lms_sma_al_furqon';
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