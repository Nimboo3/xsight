# Build stage for server
FROM node:20-alpine AS server-builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY server ./server/
COPY tsconfig.json ./

RUN pnpm install --frozen-lockfile
RUN pnpm run build:server
RUN pnpm prisma generate

# Build stage for client
FROM node:20-alpine AS client-builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY next.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY src ./src/
COPY public ./public/

RUN pnpm install --frozen-lockfile
RUN pnpm run build:client

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and prisma schema
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install production dependencies (prisma is now a prod dependency)
RUN pnpm install --frozen-lockfile --prod

# Generate Prisma client in production stage
RUN pnpm prisma generate

# Copy built server
COPY --from=server-builder /app/dist ./dist

# Copy built Next.js app
COPY --from=client-builder /app/.next ./.next
COPY --from=client-builder /app/public ./public
COPY next.config.js ./

# Expose port
EXPOSE 3000

# Start backend + worker
CMD ["sh", "-c", "node dist/server/index.js & node dist/server/services/worker.main.js & wait"]
