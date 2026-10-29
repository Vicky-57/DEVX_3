FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/widget/package*.json ./packages/widget/
COPY apps/api/package*.json ./apps/api/
COPY apps/console/package*.json ./apps/console/
COPY apps/demo-store/package*.json ./apps/demo-store/
COPY apps/retailos/package*.json ./apps/retailos/

# Install all workspace dependencies
RUN npm ci

# Copy source files
COPY tsconfig*.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Build all packages and apps
RUN npm run build

# Runtime Stage for API Backend
FROM node:20-alpine AS api

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# Create data directory for SQLite WAL persistence
RUN mkdir -p /app/apps/api/data

ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

CMD ["sh", "-c", "node apps/api/dist/seed.js && node apps/api/dist/index.js"]

