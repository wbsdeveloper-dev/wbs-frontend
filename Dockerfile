FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build args for API URLs (baked into the client bundle at build time)
ARG NEXT_PUBLIC_API_HOST
ARG NEXT_PUBLIC_BOT_PRIMARY_API
ARG NEXT_PUBLIC_BOT_SECONDARY_API
ENV NEXT_PUBLIC_API_HOST=$NEXT_PUBLIC_API_HOST
ENV NEXT_PUBLIC_BOT_PRIMARY_API=$NEXT_PUBLIC_BOT_PRIMARY_API
ENV NEXT_PUBLIC_BOT_SECONDARY_API=$NEXT_PUBLIC_BOT_SECONDARY_API

# Build
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
