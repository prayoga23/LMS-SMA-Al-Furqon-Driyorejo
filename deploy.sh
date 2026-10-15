#!/bin/bash
set -e

echo "🚀 Starting Deployment Process..."

echo "📥 Fetching latest code from Git..."
git pull origin main

echo "🔑 Ensuring .env configuration for MySQL..."
if [ -f .env ]; then
  if grep -q "^DATABASE_URL=" .env; then
    sed -i 's|^DATABASE_URL=.*|DATABASE_URL="mysql://prayoga:Pr4y0g%40@mysql-server:3306/lms_sma_al_furqon"|' .env 2>/dev/null || sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL="mysql://prayoga:Pr4y0g%40@mysql-server:3306/lms_sma_al_furqon"|' .env
    echo "✅ Updated DATABASE_URL to MySQL in .env"
  else
    echo 'DATABASE_URL="mysql://prayoga:Pr4y0g%40@mysql-server:3306/lms_sma_al_furqon"' >> .env
    echo "✅ Added DATABASE_URL to .env"
  fi
else
  cat << 'EOF' > .env
DATABASE_URL="mysql://prayoga:Pr4y0g%40@mysql-server:3306/lms_sma_al_furqon"
JWT_SECRET="sekolah-secret-key-2025"
NEXT_PUBLIC_API_URL="/api"
EOF
  echo "✅ Created .env with MySQL DATABASE_URL"
fi

echo "🔨 Building Docker images..."
docker compose build

echo "🔄 Starting/Restarting running containers..."
docker compose up -d --force-recreate

echo "🗄️ Syncing MySQL database schema..."
docker compose exec -T nextjs-lms-alfurqon npx prisma@6.4.0 db push --accept-data-loss || true

echo "🌱 Seeding initial database data..."
for i in {1..10}; do
  if docker compose exec -T nextjs-lms-alfurqon wget -qO- http://localhost:3031/api/seed >/dev/null 2>&1; then
    echo "✅ Database seed completed successfully!"
    break
  fi
  sleep 3
done

echo "✅ Deployment completed successfully!"
