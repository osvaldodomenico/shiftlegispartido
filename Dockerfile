FROM node:22-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npx prisma generate
RUN npm run build

# ─── Production image ───────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY backend/prisma ./prisma

EXPOSE 3000

# Sincroniza schema (só cria tabelas novas com prefixo partido_, nunca destrói) e sobe o app
CMD ["sh", "-c", "npx prisma db push --accept-data-loss=false --skip-generate && node dist/main"]
