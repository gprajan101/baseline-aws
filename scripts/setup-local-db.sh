#!/usr/bin/env bash
set -euo pipefail

ENDPOINT="http://localhost:8000"
TABLE_NAME="BaselineUsers"
REGION="us-east-1"

echo "🔧 Setting up local DynamoDB table: $TABLE_NAME"

# Delete table if it already exists (idempotent)
if aws dynamodb describe-table \
    --table-name "$TABLE_NAME" \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION" \
    &>/dev/null; then
    echo "⚠️  Table $TABLE_NAME already exists — deleting..."
    aws dynamodb delete-table \
        --table-name "$TABLE_NAME" \
        --endpoint-url "$ENDPOINT" \
        --region "$REGION" \
        &>/dev/null
    aws dynamodb wait table-not-exists \
        --table-name "$TABLE_NAME" \
        --endpoint-url "$ENDPOINT" \
        --region "$REGION" \
        2>/dev/null || sleep 2
    echo "   Deleted."
fi

# Create table matching CDK DatabaseStack schema
echo "📦 Creating table $TABLE_NAME..."
aws dynamodb create-table \
    --table-name "$TABLE_NAME" \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        '[{
            "IndexName": "GSI1",
            "KeySchema": [
                {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
            ],
            "Projection": {"ProjectionType": "ALL"}
        }]' \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION" \
    &>/dev/null

echo "✅ Table $TABLE_NAME created successfully!"
echo ""
echo "   Endpoint:  $ENDPOINT"
echo "   Table:     $TABLE_NAME"
echo "   Keys:      PK (HASH), SK (RANGE)"
echo "   GSI1:      GSI1PK (HASH), GSI1SK (RANGE)"
