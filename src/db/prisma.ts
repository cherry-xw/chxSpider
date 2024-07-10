import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  // 可以根据需要开启不同等级的 log
  log: ['error'] // "query", "info", "warn",
});

export default prisma;

export * from '@prisma/client';
