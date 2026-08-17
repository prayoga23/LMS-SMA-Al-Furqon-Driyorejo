import { PrismaClient as StandardPrismaClient } from '@prisma/client';
import path from 'path';

declare const __non_webpack_require__: any;

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

const getFreshPrismaClient = (): any => {
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
    const client = new FreshClient({ log: ['error', 'warn'] });
    if (client && client.teacher) {
      return client;
    }
  } catch (err) {
    // Fallback if dynamic require fails
  }

  return new StandardPrismaClient({ log: ['error', 'warn'] });
};

const getClient = (): any => {
  let instance = globalForPrisma.prisma;

  if (!instance || !instance.teacher || !instance.teacherAttendance) {
    instance = getFreshPrismaClient();
    globalForPrisma.prisma = instance;
  }

  return instance;
};

export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    let client = getClient();
    let value = client[prop];

    if (value === undefined && (prop === 'teacher' || prop === 'teacherAttendance')) {
      globalForPrisma.prisma = undefined;
      client = getFreshPrismaClient();
      globalForPrisma.prisma = client;
      value = client[prop];
    }

    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
