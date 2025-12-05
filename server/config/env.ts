import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  
  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),
  
  // Shopify
  SHOPIFY_API_KEY: z.string().min(1, 'SHOPIFY_API_KEY is required'),
  SHOPIFY_API_SECRET: z.string().min(1, 'SHOPIFY_API_SECRET is required'),
  SHOPIFY_SCOPES: z.string().default('read_customers,read_orders,read_products,read_checkouts,write_webhooks'),
  SHOPIFY_APP_URL: z.string().url('SHOPIFY_APP_URL must be a valid URL'),
  
  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'),
  
  // Frontend
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
});

// Parse and validate environment
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Derived config
export const config = {
  // Server
  port: parseInt(env.PORT, 10),
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  
  // Database
  databaseUrl: env.DATABASE_URL,
  
  // Redis
  redisUrl: env.REDIS_URL,
  
  // Shopify
  shopify: {
    apiKey: env.SHOPIFY_API_KEY,
    apiSecret: env.SHOPIFY_API_SECRET,
    scopes: env.SHOPIFY_SCOPES.split(','),
    appUrl: env.SHOPIFY_APP_URL,
    apiVersion: '2024-10' as const,
  },
  
  // Security
  jwtSecret: env.JWT_SECRET,
  encryptionKey: env.ENCRYPTION_KEY,
  
  // Frontend
  frontendUrl: env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
};

export type Config = typeof config;
