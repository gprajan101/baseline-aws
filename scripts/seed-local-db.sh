#!/usr/bin/env bash
set -euo pipefail

ENDPOINT="http://localhost:8000"
TABLE_NAME="BaselineUsers"
REGION="us-east-1"

SAMPLE_USER_ID="local-test-user-001"
SAMPLE_EMAIL="testuser@example.com"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "🌱 Seeding sample user into $TABLE_NAME"

aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item '{
        "PK":        {"S": "USER#'"$SAMPLE_USER_ID"'"},
        "SK":        {"S": "PROFILE"},
        "GSI1PK":    {"S": "EMAIL#'"$SAMPLE_EMAIL"'"},
        "GSI1SK":    {"S": "USER#'"$SAMPLE_USER_ID"'"},
        "userId":    {"S": "'"$SAMPLE_USER_ID"'"},
        "email":     {"S": "'"$SAMPLE_EMAIL"'"},
        "givenName": {"S": "Test"},
        "familyName":{"S": "User"},
        "bio":       {"S": "Sample user for local development"},
        "avatarUrl": {"S": ""},
        "createdAt": {"S": "'"$NOW"'"},
        "updatedAt": {"S": "'"$NOW"'"}
    }' \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION"

echo "✅ Sample user seeded!"
echo ""
echo "   PK:    USER#$SAMPLE_USER_ID"
echo "   SK:    PROFILE"
echo "   Email: $SAMPLE_EMAIL"
echo "   Name:  Test User"
echo ""
echo "To verify, run:"
echo "   aws dynamodb scan --table-name $TABLE_NAME --endpoint-url $ENDPOINT --region $REGION"
