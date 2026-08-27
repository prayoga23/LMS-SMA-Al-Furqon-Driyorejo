#!/bin/bash
set -e

echo "🚀 Starting Deployment Process..."

echo "📥 Fetching latest code from Git..."
git pull origin main

echo "🔨 Building Docker images..."
docker compose build

echo "🔄 Starting/Restarting running containers..."
docker compose up -d --force-recreate

echo "🗄️ Syncing Neon PostgreSQL database schema..."
docker compose exec -T nextjs-lms-alfurqon npx prisma db push --accept-data-loss || true

echo "🌱 Seeding initial database data..."
sleep 3
docker compose exec -T nextjs-lms-alfurqon npx tsx prisma/seed.ts || true

echo "✅ Deployment completed successfully!"
