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
RUN npm run build

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:22-slim

WORKDIR /app

# IMPORTANT: We copy .next FIRST from builder before running npm ci in stage 2.
# This forces Docker BuildKit to wait for Stage 1 to finish completely before 
# starting Stage 2's npm ci, reducing peak RAM usage and preventing engine crashes.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/scripts/ ./scripts/
COPY --from=builder /app/package.json /app/package-lock.json* ./

RUN mkdir -p public

# Install production dependencies only (now runs sequentially after build)
RUN npm ci --omit=dev

# Make sure scripts are executable
RUN chmod +x ./scripts/generate-env.sh

# Change ownership of public directory so node user can write env-config.js
RUN chown -R node:node /app/public

# Use non-root user for security
USER node

# Expose frontend port
EXPOSE 3000

# Start Next.js production server on 0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Generate runtime env config and start Next.js
CMD ["/bin/sh", "-c", "./scripts/generate-env.sh && npm start"]
