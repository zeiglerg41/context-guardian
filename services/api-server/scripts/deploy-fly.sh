#!/bin/bash
set -e

echo "🚀 Deploying Context Guardian API to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Install it from https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Run: flyctl auth login"
    exit 1
fi

# Set secrets (if not already set)
echo "Setting environment variables..."
flyctl secrets set \
  DATABASE_URL="$DATABASE_URL" \
  REDIS_URL="$REDIS_URL" \
  API_KEY="$API_KEY" \
  CACHE_TTL="86400" \
  --app context-guardian-api

# Deploy
echo "Deploying application..."
flyctl deploy --app context-guardian-api

echo "✅ Deployment complete!"
echo "🌐 Your API is live at: https://context-guardian-api.fly.dev"
