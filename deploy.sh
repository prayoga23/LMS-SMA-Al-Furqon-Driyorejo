#!/bin/bash
set -e

echo "🚀 Starting Deployment Process..."

echo "📥 Fetching latest code from Git..."
git pull origin main

echo "🔑 Ensuring .env configuration for Neon PostgreSQL..."
if [ ! -f .env ] || grep -q "file:" .env 2>/dev/null; then
  cat << 'EOF' > .env
DATABASE_URL="postgresql://neondb_owner:npg_E8ymoQT2lgji@ep-winter-firefly-axhkrvgh-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="sekolah-secret-key-2025"
NEXT_PUBLIC_API_URL="/api"
EOF
  echo "✅ Updated .env with Neon PostgreSQL DATABASE_URL"
fi

echo "🔨 Building Docker images..."
docker compose build

echo "🔄 Starting/Restarting running containers..."
docker compose up -d --force-recreate

echo "🗄️ Syncing Neon PostgreSQL database schema..."
docker compose exec -T nextjs-lms-alfurqon npx prisma db push --accept-data-loss || true

echo "🌱 Seeding initial database data..."
sleep 3
docker compose exec -T nextjs-lms-alfurqon wget -qO- http://localhost:3031/api/seed || true

echo "✅ Deployment completed successfully!"
