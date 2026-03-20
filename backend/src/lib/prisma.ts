import { PrismaClient } from '@prisma/client';

// PrismaClient tek instance olarak tutulur (connection pool için)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Bağlantıyı önceden kur
  client.$connect().catch((err) => {
    console.error('[Prisma] Veritabanı bağlantısı kurulamadı:', err);
    process.exit(1);
  });

  return client;
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

