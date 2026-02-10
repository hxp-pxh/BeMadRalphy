# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install runtime dependencies only
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built files
COPY --from=builder /app/dist ./dist
COPY README.md LICENSE ./

# Make CLI executable
RUN chmod +x dist/cli.js && ln -s /app/dist/cli.js /usr/local/bin/bemadralphy

ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--help"]
