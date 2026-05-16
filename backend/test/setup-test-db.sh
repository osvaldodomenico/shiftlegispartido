#!/usr/bin/env bash
# Cria o banco de testes e aplica as migrations
set -e
mysql -u root -e "CREATE DATABASE IF NOT EXISTS shiftpartido_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
DATABASE_URL="mysql://root@localhost:3306/shiftpartido_test" npx prisma migrate deploy
echo "✓ shiftpartido_test pronto"
