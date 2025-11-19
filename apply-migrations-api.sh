#!/bin/bash

PROJECT_URL="https://ekswazmqhwtxzgdckpxt.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc3dhem1xaHd0eHpnZGNrcHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDY2MzMsImV4cCI6MjA3NzgyMjYzM30.Y04J2jVcms5kRYcS15QZ8ATanQrvVvbohmUSOV07X9U"
SERVICE_ROLE_KEY=""  # Need this for admin operations

echo "Attempting to apply migrations via direct API..."
echo "Project URL: $PROJECT_URL"

# Test connection
echo "Testing connection..."
curl -s -X GET "$PROJECT_URL/rest/v1/users?limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -o /dev/null -w "HTTP Status: %{http_code}\n"

echo "✓ Connection successful!"
echo ""
echo "Note: To apply migrations, we need the Supabase access token."
echo "Please provide your Supabase access token from:"
echo "  https://app.supabase.com/ → Settings → Access Tokens"

