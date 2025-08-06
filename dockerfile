# ---- Builder Stage ----
    FROM node:22-alpine AS builder

    # Install Bun globally
    RUN npm install -g bun
    
    # Set working directory
    WORKDIR /app
    
    # Copy only dependency files first (cache optimization)
    COPY package.json ./
    COPY bun.lockb* ./
    
    # Install all dependencies (dev + prod)
    RUN bun install --frozen-lockfile || bun install --no-cache
    
    # Copy rest of the application
    COPY . .
    
    # Build TypeScript into JavaScript
    RUN bun run build
    
    # ---- Production Runner Stage ----
    FROM node:22-alpine AS runner
    
    # Install Bun globally
    RUN npm install -g bun
    
    # Set working directory
    WORKDIR /app
    
    # Copy only production artifacts from builder
    COPY --from=builder /app/package.json ./
    COPY --from=builder /app/bun.lockb* ./
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/dist ./dist
    
    # Reinstall only production dependencies (safe & clean)
    RUN bun install --production --frozen-lockfile || bun install --no-cache --production
    
    # Expose app port
    EXPOSE 3000
    
    # Start the app
    CMD ["node", "dist/src/index.js"]
    