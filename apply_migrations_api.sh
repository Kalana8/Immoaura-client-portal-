#!/bin/bash

PROJECT_URL="https://ekswazmqhwtxzgdckpxt.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc3dhem1xaHd0eHpnZGNrcHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDY2MzMsImV4cCI6MjA3NzgyMjYzM30.Y04J2jVcms5kRYcS15QZ8ATanQrvVvbohmUSOV07X9U"

echo "================================================"
echo "Applying Migrations via API"
echo "================================================"
echo ""

# Function to execute SQL
execute_sql() {
    local sql_file=$1
    local migration_name=$(basename "$sql_file")
    
    echo "Applying: $migration_name"
    
    # Read the SQL file
    local sql_content=$(cat "$sql_file")
    
    # Send to API
    curl -s -X POST "$PROJECT_URL/rest/v1/rpc/execute_sql" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"sql\": \"$(echo "$sql_content" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')\"}" \
        2>&1
}

# Test connection first
echo "Testing connection..."
curl -s -X GET "$PROJECT_URL/rest/v1/users?limit=1" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -w "\nHTTP Status: %{http_code}\n" \
    -o /dev/null

echo ""
echo "Connection test completed."
echo ""
echo "Note: Supabase REST API doesn't support arbitrary SQL execution."
echo "We need to use the Supabase Dashboard or CLI for migrations."
echo ""
echo "Alternative: Use Supabase Dashboard SQL Editor"
echo "1. Go to https://app.supabase.com/"
echo "2. Select project: ekswazmqhwtxzgdckpxt"
echo "3. Go to SQL Editor"
echo "4. Copy and run each migration file"

