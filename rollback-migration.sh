#!/bin/bash

# Supabase Migration Rollback Script
# This script restores the old project configuration

set -e

echo "=========================================="
echo "Supabase Migration Rollback Script"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup files exist
if [ ! -f "supabase/config.toml.backup" ]; then
    echo -e "${RED}Error: No backup found!${NC}"
    echo "No supabase/config.toml.backup file exists."
    exit 1
fi

read -p "Are you sure you want to rollback the migration? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Rolling back migration...${NC}"
echo ""

# Restore config.toml
echo "Restoring supabase/config.toml..."
mv supabase/config.toml.backup supabase/config.toml
echo -e "${GREEN}✓ Restored supabase/config.toml${NC}"

# Restore .env.local if backup exists
if [ -f ".env.local.backup" ]; then
    echo "Restoring .env.local..."
    mv .env.local.backup .env.local
    echo -e "${GREEN}✓ Restored .env.local${NC}"
fi

echo ""
echo -e "${GREEN}✓ Rollback complete!${NC}"
echo ""
echo "Your configuration has been restored to the old project."
echo "Run 'npm run dev' to start with the original project."
echo ""
echo "Note: The new project data is still on the server."
echo "If you want to remove it, delete the project from Supabase Dashboard."
echo "=========================================="
