FROM oven/bun:latest AS base
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/
 
# Copy source code
COPY . .
 
# Install dependencies
RUN bun install
 
# Build for single origin
RUN bun run build:single

FROM oven/bun:slim AS prod
WORKDIR /prod
COPY --from=base /app/server/static ./server/static
COPY --from=base /app/server/dist ./server/dist
COPY --from=base /app/shared/dist ./shared/dist
COPY --from=base /app/package.json ./package.json

EXPOSE 3000
CMD ["bun", "run", "start:single"]
