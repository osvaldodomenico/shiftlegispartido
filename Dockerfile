FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .

RUN npx prisma generate

RUN npm run build && echo "=== BUILD OK ===" && ls -la dist/

RUN npm prune --omit=dev

EXPOSE 3000

# Sincroniza schema (só cria tabelas novas com prefixo partido_, nunca destrói) e sobe o app
CMD ["sh", "-c", "echo '=== DIST CONTENTS ===' && ls -la /app/dist/ 2>&1 || echo 'NO DIST DIR' && npx prisma db push --accept-data-loss=false --skip-generate && node dist/main"]
