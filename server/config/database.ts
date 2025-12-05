import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });
};

// Prevent multiple instances during development hot reload
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Graceful shutdown helper
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
