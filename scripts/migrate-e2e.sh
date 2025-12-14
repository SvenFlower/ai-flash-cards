#!/bin/bash
# Script to migrate the e2e Supabase instance

set -e

echo "🔄 Migrating e2e Supabase instance..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Installing..."
    npm install -g supabase
fi

# Link to e2e project
echo "🔗 Linking to e2e Supabase project..."
npx supabase link --project-ref fpjusbeyprcxetnaqcdk

# Push migrations
echo "📤 Pushing migrations to e2e instance..."
npx supabase db push --linked

echo ""
echo "✅ E2E database migrations completed successfully!"
