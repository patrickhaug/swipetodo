#!/bin/bash
# SwipeTodo PocketBase Schema Setup Script
# This script sets up the collections for the SwipeTodo application
#
# Prerequisites:
# - PocketBase must be running (./start.sh)
# - A superuser account must exist
#
# Usage: ./setup_schema.sh <admin_email> <admin_password>

set -e

BASE_URL="${POCKETBASE_URL:-http://127.0.0.1:8090}"
ADMIN_EMAIL="${1:-admin@swipetodo.local}"
ADMIN_PASSWORD="${2:-adminpassword123}"

echo "SwipeTodo PocketBase Schema Setup"
echo "=================================="
echo "Base URL: $BASE_URL"
echo ""

# Check if PocketBase is running
echo "Checking PocketBase health..."
if ! curl -s "$BASE_URL/api/health" | grep -q "healthy"; then
    echo "ERROR: PocketBase is not running at $BASE_URL"
    echo "Start it with: ./start.sh"
    exit 1
fi
echo "PocketBase is healthy!"

# Authenticate as superuser
echo ""
echo "Authenticating as superuser..."
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
    echo "ERROR: Failed to authenticate. Make sure the superuser exists."
    echo "Create one with: ./pocketbase superuser create $ADMIN_EMAIL $ADMIN_PASSWORD"
    exit 1
fi
echo "Authentication successful!"

# Function to create or update collection
create_collection() {
    local name=$1
    local json_file=$2

    echo ""
    echo "Setting up collection: $name"

    # Check if collection exists
    EXISTS=$(curl -s "$BASE_URL/api/collections/$name" \
        -H "Authorization: $TOKEN" \
        -o /dev/null -w "%{http_code}")

    if [ "$EXISTS" = "200" ]; then
        echo "  Collection '$name' already exists"
    else
        echo "  Creating collection '$name'..."
        curl -s -X POST "$BASE_URL/api/collections" \
            -H "Authorization: $TOKEN" \
            -H "Content-Type: application/json" \
            -d @"$json_file" > /dev/null
        echo "  Created!"
    fi
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create households collection
echo ""
echo "Creating households collection..."
cat <<'JSONEOF' | curl -s -X POST "$BASE_URL/api/collections" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- > /dev/null 2>&1 || true
{
  "name": "households",
  "type": "base",
  "fields": [
    {"name": "name", "type": "text", "required": true, "min": 1},
    {"name": "invite_code", "type": "text", "required": true, "min": 6, "max": 6},
    {"name": "created_by", "type": "relation", "required": true, "maxSelect": 1, "collectionId": "_pb_users_auth_"}
  ],
  "indexes": ["CREATE UNIQUE INDEX idx_invite_code ON households (invite_code)"]
}
JSONEOF

# Get households collection ID
HOUSEHOLDS_ID=$(curl -s "$BASE_URL/api/collections/households" -H "Authorization: $TOKEN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

if [ -n "$HOUSEHOLDS_ID" ]; then
    echo "Households collection ready (ID: $HOUSEHOLDS_ID)"

    # Update users collection to add household and display_name fields
    echo ""
    echo "Updating users collection with household and display_name fields..."

    # Get current users fields and add new ones
    USERS_JSON=$(curl -s "$BASE_URL/api/collections/users" -H "Authorization: $TOKEN")

    # Add household relation field to users
    cat <<JSONEOF | curl -s -X PATCH "$BASE_URL/api/collections/users" \
      -H "Authorization: $TOKEN" \
      -H "Content-Type: application/json" \
      -d @- > /dev/null
{
  "fields+": [
    {
      "name": "household",
      "type": "relation",
      "required": false,
      "maxSelect": 1,
      "collectionId": "$HOUSEHOLDS_ID"
    },
    {
      "name": "display_name",
      "type": "text",
      "required": false,
      "max": 255
    }
  ]
}
JSONEOF
    echo "Users collection updated!"

    # Set households API rules
    echo ""
    echo "Setting households API rules..."
    cat <<'JSONEOF' | curl -s -X PATCH "$BASE_URL/api/collections/households" \
      -H "Authorization: $TOKEN" \
      -H "Content-Type: application/json" \
      -d @- > /dev/null
{
  "listRule": "@request.auth.id != '' && (@request.auth.household = id || created_by = @request.auth.id)",
  "viewRule": "@request.auth.id != '' && (@request.auth.household = id || created_by = @request.auth.id)",
  "createRule": "@request.auth.id != ''"
}
JSONEOF
    echo "Households rules set!"

    # Create todos collection
    echo ""
    echo "Creating todos collection..."
    cat <<JSONEOF | curl -s -X POST "$BASE_URL/api/collections" \
      -H "Authorization: $TOKEN" \
      -H "Content-Type: application/json" \
      -d @- > /dev/null 2>&1 || true
{
  "name": "todos",
  "type": "base",
  "listRule": "@request.auth.id != '' && @request.auth.household = household",
  "viewRule": "@request.auth.id != '' && @request.auth.household = household",
  "updateRule": "@request.auth.id != '' && @request.auth.household = household",
  "deleteRule": "@request.auth.id != '' && @request.auth.household = household",
  "fields": [
    {"name": "text", "type": "text", "required": true, "min": 1},
    {"name": "due_date", "type": "date", "required": false},
    {"name": "status", "type": "select", "required": true, "values": ["pool", "assigned", "done"], "maxSelect": 1},
    {"name": "household", "type": "relation", "required": true, "maxSelect": 1, "collectionId": "$HOUSEHOLDS_ID"},
    {"name": "assigned_to", "type": "relation", "required": false, "maxSelect": 1, "collectionId": "_pb_users_auth_"},
    {"name": "created_by", "type": "relation", "required": true, "maxSelect": 1, "collectionId": "_pb_users_auth_"},
    {"name": "sort_order", "type": "number", "required": false}
  ]
}
JSONEOF

    # Set todos createRule (needs @request.body syntax)
    cat <<'JSONEOF' | curl -s -X PATCH "$BASE_URL/api/collections/todos" \
      -H "Authorization: $TOKEN" \
      -H "Content-Type: application/json" \
      -d @- > /dev/null
{
  "createRule": "@request.auth.id != '' && @request.auth.household = @request.body.household"
}
JSONEOF
    echo "Todos collection ready!"
fi

echo ""
echo "=================================="
echo "Schema setup complete!"
echo ""
echo "Collections created:"
echo "  - households"
echo "  - todos"
echo ""
echo "Users collection extended with:"
echo "  - household (relation)"
echo "  - display_name (text)"
echo ""
echo "You can now access the admin UI at: $BASE_URL/_/"
