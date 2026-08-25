#!/bin/bash
set -e

echo "🚀 Starting Deployment Process..."

echo "📥 Fetching latest code from Git..."
git pull origin main

echo "🔨 Building Docker images..."
docker compose build

echo "🔄 Updating running containers..."
docker compose up -d

echo "🗄️ Syncing SQLite database schema..."
# Gunakan prisma@6 agar npx tidak mengunduh Prisma 7 (versi terbaru dengan breaking changes)
npx prisma@6 db push --accept-data-loss

echo "🌱 Seeding database..."
npx prisma@6 db seed || true

echo "✅ Deployment completed successfully!"
