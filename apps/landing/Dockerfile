FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build client and server
RUN pnpm run build

# Remove devDependencies
RUN pnpm prune --prod

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "import('http').then(h => h.default.get('http://localhost:3000/', r => process.exit(r.statusCode === 200 ? 0 : 1)))"

CMD ["node", "dist/index.js"]
