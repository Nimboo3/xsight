# Build stage for server
FROM node:20-alpine AS server-builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY server ./server/

RUN npm ci --only=production=false
RUN npm run build:server
RUN npx prisma generate

# Build stage for client
FROM node:20-alpine AS client-builder

WORKDIR /app

COPY package*.json ./
COPY next.config.js ./
COPY tsconfig.json ./
COPY src ./src/
COPY public ./public/

RUN npm ci --only=production=false
RUN npm run build:client

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built server
COPY --from=server-builder /app/dist ./dist

# Copy built Next.js app
COPY --from=client-builder /app/.next ./.next
COPY --from=client-builder /app/public ./public
COPY next.config.js ./

# Expose ports
EXPOSE 3000 3001

# Start command
CMD ["npm", "run", "start"]
