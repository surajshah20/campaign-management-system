# ==============================================================================
# AGENCY OS — PRODUCTION DOCKERFILE (BACKEND SERVICE)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root package and server package definitions
COPY server/package.json server/pnpm-lock.yaml* ./server/

WORKDIR /app/server
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code and Prisma schema
COPY server/ ./
RUN npx prisma generate
RUN pnpm run build

# Production Runtime Image
FROM node:20-alpine AS runner

WORKDIR /app/server

ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma

EXPOSE 5000

CMD ["node", "dist/server.js"]
