# AI Sports OS — Production Dockerfile
# Deploy to Railway / Fly.io / any Docker host

FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config
COPY package.json pnpm-workspace.yaml ./

# Copy all workspace packages
COPY backend/package.json backend/
COPY modules/ modules/
COPY providers/ providers/
COPY shared/ shared/
COPY infrastructure/ infrastructure/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod false

# Copy source
COPY backend/ backend/

# Expose port
EXPOSE 3001

# Start with ts-node transpile-only
CMD ["npx", "ts-node", "--transpile-only", "--compiler-options", "{\"experimentalDecorators\":true,\"emitDecoratorMetadata\":true,\"strict\":false,\"module\":\"commonjs\"}", "backend/src/main.prod.ts"]
