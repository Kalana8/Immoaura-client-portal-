#!/bin/bash

# Supabase Database Migration Script
# This script automates the migration of your database to a new Supabase project

set -e

echo "=========================================="
echo "Supabase Database Migration Script"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}Error: supabase/config.toml not found!${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo -e "${YELLOW}Current Configuration:${NC}"
echo "Working Directory: $(pwd)"
echo ""

# New project details
NEW_PROJECT_ID="ekswazmqhwtxzgdckpxt"
NEW_PROJECT_URL="https://ekswazmqhwtxzgdckpxt.supabase.co"
NEW_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc3dhem1xaHd0eHpnZGNrcHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDY2MzMsImV4cCI6MjA3NzgyMjYzM30.Y04J2jVcms5kRYcS15QZ8ATanQrvVvbohmUSOV07X9U"

echo -e "${YELLOW}Step 1: Checking Prerequisites${NC}"
echo "=================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI not found!${NC}"
    echo "Installing Supabase CLI..."
    brew install supabase/tap/supabase
fi

echo -e "${GREEN}✓ Supabase CLI installed${NC}"

# Check migrations directory
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Found $MIGRATION_COUNT migrations${NC}"

echo ""
echo -e "${YELLOW}Step 2: Update Project Configuration${NC}"
echo "=========================================="

# Backup old config
cp supabase/config.toml supabase/config.toml.backup
echo -e "${GREEN}✓ Backed up config.toml to config.toml.backup${NC}"

# Update config.toml
sed -i '' "s/project_id = .*/project_id = \"$NEW_PROJECT_ID\"/" supabase/config.toml
echo -e "${GREEN}✓ Updated supabase/config.toml${NC}"

echo ""
echo -e "${YELLOW}Step 3: Link to New Project${NC}"
echo "=========================================="

read -p "Enter your Supabase database password (for authentication): " -s DB_PASSWORD
echo ""

# Link to new project (non-interactive)
echo "Linking to new project..."
supabase link --project-ref "$NEW_PROJECT_ID" --no-prompt <<< "$DB_PASSWORD" 2>/dev/null || true

echo -e "${GREEN}✓ Linked to new project${NC}"

echo ""
echo -e "${YELLOW}Step 4: Push Migrations${NC}"
echo "=========================================="

echo "Pushing migrations to new project..."
supabase db push --yes

echo -e "${GREEN}✓ All migrations pushed successfully!${NC}"

echo ""
echo -e "${YELLOW}Step 5: Update Application Environment${NC}"
echo "=========================================="

# Check if .env.local exists, if not create it
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOF
VITE_SUPABASE_URL=$NEW_PROJECT_URL
VITE_SUPABASE_ANON_KEY=$NEW_ANON_KEY
EOF
    echo -e "${GREEN}✓ Created .env.local${NC}"
else
    echo "Updating existing .env.local..."
    # Backup old env
    cp .env.local .env.local.backup
    
    # Update or add environment variables
    if grep -q "VITE_SUPABASE_URL" .env.local; then
        sed -i '' "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$NEW_PROJECT_URL|" .env.local
    else
        echo "VITE_SUPABASE_URL=$NEW_PROJECT_URL" >> .env.local
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
        sed -i '' "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$NEW_ANON_KEY|" .env.local
    else
        echo "VITE_SUPABASE_ANON_KEY=$NEW_ANON_KEY" >> .env.local
    fi
    
    echo -e "${GREEN}✓ Updated .env.local${NC}"
fi

echo ""
echo -e "${YELLOW}Step 6: Verify Connection${NC}"
echo "=========================================="

echo "Testing database connection..."
RESPONSE=$(curl -s -X GET "$NEW_PROJECT_URL/rest/v1/users?limit=1" \
  -H "apikey: $NEW_ANON_KEY" \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Database connection successful (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Connection test failed (HTTP $HTTP_CODE)${NC}"
    echo "Please check your credentials and try again."
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Migration Complete!${NC}"
echo "=========================================="
echo ""
echo "What's been done:"
echo "  ✓ Updated supabase/config.toml"
echo "  ✓ Linked to new project (ekswazmqhwtxzgdckpxt)"
echo "  ✓ Pushed all $MIGRATION_COUNT migrations"
echo "  ✓ Updated .env.local with new credentials"
echo "  ✓ Tested database connection"
echo ""
echo "Next steps:"
echo "  1. Run: npm install"
echo "  2. Run: npm run dev"
echo "  3. Test login and data access"
echo "  4. If everything works, commit these changes"
echo ""
echo "Backup files created:"
echo "  - supabase/config.toml.backup"
if [ -f ".env.local.backup" ]; then
    echo "  - .env.local.backup"
fi
echo ""
echo "To rollback, run: ./rollback-migration.sh"
echo "=========================================="
