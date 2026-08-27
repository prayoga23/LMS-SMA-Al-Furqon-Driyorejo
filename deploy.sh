#!/bin/bash
set -e

echo "🚀 Starting Deployment Process..."

echo "📥 Fetching latest code from Git..."
git pull origin main

echo "🔒 Ensuring SQLite database directory permissions..."
mkdir -p ./prisma
chmod -R 777 ./prisma

echo "🗄️ Syncing SQLite database schema..."
npx prisma@6 db push --accept-data-loss || npx prisma db push --accept-data-loss

echo "🌱 Seeding database..."
npx tsx prisma/seed.ts || true

echo "🔒 Re-applying database permissions..."
chmod -R 777 ./prisma

echo "🔨 Building Docker images..."
docker compose build

echo "🔄 Starting/Restarting running containers..."
docker compose up -d --force-recreate

echo "✅ Deployment completed successfully!"
