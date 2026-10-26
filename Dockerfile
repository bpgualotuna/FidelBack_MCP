# Etapa 1: build
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.14.0 --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# prisma generate no requiere una DB real durante el build
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build
RUN pnpm prune --prod --ignore-scripts

# Etapa 2: runtime
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts

USER node
EXPOSE 4000
CMD ["node", "dist/main"]
