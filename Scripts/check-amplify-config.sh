#!/bin/bash

# Script to verify Amplify configuration before deployment
# Note: Next.js Turbopack doesn't support symlinks, so we use file copies

CONFIG_FILE="amplify_outputs.json"
BACKEND_CONFIG="../Backend/amplify_outputs.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Amplify Configuration Check"
echo ""

# Check if running in Web directory
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}❌ Error: $CONFIG_FILE not found. Run this script from the Web directory.${NC}"
    exit 1
fi

# Check for sandbox indicators
if grep -q "sandbox" "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${RED}❌ WARNING: Config appears to be pointing to a SANDBOX environment!${NC}"
    echo ""
    echo "For production deployment:"
    echo "1. Deploy Backend to production: cd ../Backend && npx ampx pipeline-deploy --branch main"
    echo "2. Run: ./Scripts/switch-amplify-env.sh to copy the new config"
    exit 1
fi

# Check if Backend config exists and compare
if [ -f "$BACKEND_CONFIG" ]; then
    if diff -q "$CONFIG_FILE" "$BACKEND_CONFIG" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Config is in sync with Backend${NC}"
    else
        echo -e "${YELLOW}⚠️  Config differs from Backend - run ./Scripts/switch-amplify-env.sh to sync${NC}"
    fi
fi

# Extract and display configuration details
echo ""
echo "Configuration details:"
ENDPOINT=$(grep -o '"url"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | head -1 | cut -d'"' -f4 || echo "Not found")
REGION=$(grep -o '"aws_region"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | head -1 | cut -d'"' -f4 || echo "Not found")

echo "API Endpoint: $ENDPOINT"
echo "AWS Region: $REGION"

# Final status
echo ""
if grep -q "sandbox" "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${RED}❌ Configuration is SANDBOX - not ready for production${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Configuration appears ready for deployment${NC}"
fi
