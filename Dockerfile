# ============================================
# Stage 1: Install dependencies & build
# ============================================
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./

# Copy scripts folder because postinstall needs it
COPY scripts/ ./scripts/
RUN mkdir -p public

# Install ALL dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the Next.js application
# NEXT_PUBLIC_ env vars must be set at BUILD time for Next.js
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
ARG NEXT_PUBLIC_API_SERVER_URL=http://localhost:5000
ARG NEXT_PUBLIC_API_URL=http://localhost:5000

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_SERVER_URL=$NEXT_PUBLIC_API_SERVER_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy scripts folder for postinstall
COPY scripts/ ./scripts/
RUN mkdir -p public

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built Next.js output from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Use non-root user for security
USER node

# Expose frontend port
EXPOSE 3000

# Start Next.js production server on 0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["npm", "start"]
