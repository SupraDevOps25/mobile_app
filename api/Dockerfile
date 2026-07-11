# syntax=docker/dockerfile:1

# ── Builder: install deps, generate the Prisma client, compile TS ─────────────
FROM node:22-slim AS builder
WORKDIR /app

# Prisma's query engine needs OpenSSL present.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install against the lockfile first so this layer caches when only src changes.
COPY package*.json ./
RUN npm ci

# Copy the rest, generate the client (schema + prisma.config.ts must be present)
# then build to dist/.
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Runtime: same slim base, carrying only what's needed to run ───────────────
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Full node_modules is kept on purpose: `prisma migrate deploy` at start needs
# the Prisma CLI + dotenv (both dev deps) and the generated engine. For a leaner
# image later, move migrations to a separate release step and prune dev deps.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package*.json ./

# Render injects PORT; main.ts already reads process.env.PORT.
EXPOSE 3000

# Apply pending migrations, then boot. Safe for a single instance (the MVP case).
# With >1 instance, run `prisma migrate deploy` as a pre-deploy/release step so
# only one process migrates.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
