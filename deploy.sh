#!/bin/bash
set -e

echo "🚀 Starting Deployment Process..."

echo "📥 Fetching latest code from Git..."
git pull origin main

echo "🔒 Ensuring SQLite database directory permissions..."
mkdir -p ./prisma
chmod -R 777 ./prisma

echo "🔨 Building Docker images..."
docker compose build

echo "🔄 Updating running containers..."
docker compose up -d

echo "🗄️ Syncing SQLite database schema..."
docker compose exec -T nextjs-lms-alfurqon npx prisma db push --accept-data-loss || npx prisma@6 db push --accept-data-loss

echo "🌱 Seeding database..."
docker compose exec -T nextjs-lms-alfurqon npx tsx prisma/seed.ts || docker compose exec -T nextjs-lms-alfurqon npx prisma db seed || true

echo "🔒 Re-applying database permissions..."
chmod -R 777 ./prisma

echo "✅ Deployment completed successfully!"
