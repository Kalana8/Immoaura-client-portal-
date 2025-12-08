#!/bin/bash

PROJECT_URL="ekswazmqhwtxzgdckpxt"
DB_HOST="db.${PROJECT_URL}.supabase.co"
DB_USER="postgres"
DB_PASS="3ufpu45mDG3LSp4H"
DB_NAME="postgres"

echo "================================================"
echo "Applying Migrations Directly to Database"
echo "================================================"
echo ""
echo "Database: $DB_HOST"
echo "User: $DB_USER"
echo ""

# Create environment for psql
export PGPASSWORD="$DB_PASS"

# Test connection
echo "Testing connection..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Connection successful!"
    echo ""
    echo "Applying migrations in order..."
    echo ""
    
    # Apply each migration
    MIGRATIONS=(
        "supabase/migrations/20251022041141_c8359f9d-763e-4e80-bb08-0ca78d8cecbe.sql"
        "supabase/migrations/20251022050000_fix_users_rls.sql"
        "supabase/migrations/20251023000000_create_order_number_function.sql"
        "supabase/migrations/20251101192740_fix_order_number_sequence.sql"
        "supabase/migrations/20251102000000_create_admin_infrastructure.sql"
        "supabase/migrations/20251102050000_phase6_email_notifications.sql"
    )
    
    COUNT=1
    for MIGRATION in "${MIGRATIONS[@]}"; do
        echo "[$COUNT/6] Applying: $(basename $MIGRATION)"
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "      ✓ Applied successfully"
        else
            echo "      ✗ Error applying migration"
            echo "      Running with output for debugging..."
            psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION"
        fi
        COUNT=$((COUNT + 1))
    done
    
    echo ""
    echo "✓ All migrations completed!"
else
    echo "✗ Connection failed!"
    exit 1
fi

unset PGPASSWORD
