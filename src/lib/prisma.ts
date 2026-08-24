import { PrismaClient as StandardPrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

declare const __non_webpack_require__: any;

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

const getDatabaseUrl = (): string => {
  const envUrl = process.env.DATABASE_URL;

  // 1. Jika DATABASE_URL sudah di-set dari Docker / Environment Variable (dan valid), GUNAKAN LANGSUNG!
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }

  // 2. Logic khusus Provider Serverless (Vercel, Netlify, AWS Lambda) - Hapus process.env.NODE_ENV === 'production'
  const isServerless =
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const tmpDbPath = path.join('/tmp', 'dev.db');

    const possibleSources = [
      path.join(process.cwd(), 'prisma', 'dev.db'),
      path.join(process.cwd(), 'dev.db'),
      path.resolve(__dirname, '..', '..', 'prisma', 'dev.db'),
      path.resolve(__dirname, '..', 'prisma', 'dev.db'),
      '/var/task/prisma/dev.db',
      '/var/task/dev.db',
    ];

    let foundSource: string | null = null;
    for (const src of possibleSources) {
      if (fs.existsSync(/*turbopackIgnore: true*/ src)) {
        foundSource = src;
        break;
      }
    }

    if (foundSource) {
      try {
        const srcStat = fs.statSync(/*turbopackIgnore: true*/ foundSource);
        let shouldCopy = !fs.existsSync(/*turbopackIgnore: true*/ tmpDbPath);
        if (!shouldCopy) {
          const tmpStat = fs.statSync(/*turbopackIgnore: true*/ tmpDbPath);
          if (srcStat.mtimeMs > tmpStat.mtimeMs) {
            shouldCopy = true;
          }
        }

        if (shouldCopy) {
          fs.copyFileSync(/*turbopackIgnore: true*/ foundSource, tmpDbPath);
          try {
            fs.chmodSync(/*turbopackIgnore: true*/ tmpDbPath, 0o666);
          } catch {}
        }
        return `file:${tmpDbPath}`;
      } catch (err) {
        console.error('Failed to copy SQLite database to /tmp:', err);
      }
    }

    if (fs.existsSync(/*turbopackIgnore: true*/ tmpDbPath)) {
      return `file:${tmpDbPath}`;
    }
  }

  // 3. Fallback default jika di lokal dev
  const defaultPath = path.join(process.cwd(), 'prisma', 'dev.db');
  if (fs.existsSync(/*turbopackIgnore: true*/ defaultPath)) {
    return `file:${defaultPath}`;
  }
  return 'file:./prisma/dev.db';
};

const getFreshPrismaClient = (): any => {
  const dbUrl = getDatabaseUrl();
  const prismaOptions = {
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error', 'warn'] as any,
  };

  try {
    const dynamicRequire =
      typeof __non_webpack_require__ !== 'undefined'
        ? __non_webpack_require__
        : eval('require');

    const prismaClientPath = path.join(process.cwd(), 'node_modules/@prisma/client');

    if (dynamicRequire && dynamicRequire.cache) {
      Object.keys(dynamicRequire.cache).forEach((key) => {
        if (key.includes('@prisma') || key.includes('.prisma')) {
          delete dynamicRequire.cache[key];
        }
      });
    }

    const { PrismaClient: FreshClient } = dynamicRequire(prismaClientPath);
    const client = new FreshClient(prismaOptions);
    if (client && client.teacher) {
      return client;
    }
  } catch (err) {
    // Fallback jika dynamic require gagal
  }

  return new StandardPrismaClient(prismaOptions);
};

const getClient = (): any => {
  let instance = globalForPrisma.prisma;

  if (!instance || !instance.teacher || !instance.teacherAttendance || process.env.NODE_ENV === 'development') {
    instance = getFreshPrismaClient();
    globalForPrisma.prisma = instance;
  }

  return instance;
};

export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    let client = getClient();
    let value = client[prop];

    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});