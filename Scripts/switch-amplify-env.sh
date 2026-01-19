#!/bin/bash

# Script to manage Amplify configuration for Web project
# Note: Symlinks don't work with Next.js Turbopack, so we copy the file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration files
BACKEND_CONFIG="../Backend/amplify_outputs.json"
CURRENT_CONFIG="amplify_outputs.json"

echo "🔄 Amplify Configuration Manager"
echo ""

# Check current configuration
if [ -f "$CURRENT_CONFIG" ]; then
    echo -e "${GREEN}Current config exists${NC}"
else
    echo -e "${RED}No current config found!${NC}"
fi

echo ""
echo "Select action:"
echo "1) Copy from Backend (sync with latest Backend config)"
echo "2) Show current config details"
echo "3) Exit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Copying configuration from Backend...${NC}"

        if [ ! -f "$BACKEND_CONFIG" ]; then
            echo -e "${RED}❌ Error: Backend config not found at $BACKEND_CONFIG${NC}"
            exit 1
        fi

        # Check if the backend config looks like sandbox
        if grep -q "sandbox" "$BACKEND_CONFIG" 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Note: Backend config contains 'sandbox' - this might be sandbox environment${NC}"
        fi

        rm -f "$CURRENT_CONFIG"
        cp "$BACKEND_CONFIG" "$CURRENT_CONFIG"
        echo -e "${GREEN}✅ Copied config from Backend${NC}"
        echo ""
        echo -e "${BLUE}ℹ️  Run this script again after Backend deploys to sync changes${NC}"
        ;;
    2)
        echo ""
        echo "Current configuration details:"
        if [ -f "$CURRENT_CONFIG" ]; then
            # Extract and display key information
            ENDPOINT=$(grep -o '"url"[[:space:]]*:[[:space:]]*"[^"]*"' "$CURRENT_CONFIG" | head -1 | cut -d'"' -f4 || echo "Not found")
            REGION=$(grep -o '"aws_region"[[:space:]]*:[[:space:]]*"[^"]*"' "$CURRENT_CONFIG" | head -1 | cut -d'"' -f4 || echo "Not found")

            echo "API Endpoint: $ENDPOINT"
            echo "AWS Region: $REGION"

            if [[ "$ENDPOINT" == *"sandbox"* ]]; then
                echo -e "${YELLOW}⚠️  This appears to be a SANDBOX configuration${NC}"
            else
                echo -e "${GREEN}This appears to be a PRODUCTION configuration${NC}"
            fi
        else
            echo -e "${RED}No configuration file found${NC}"
        fi
        ;;
    3)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo "🔍 Next steps:"
echo "   - After Backend deploy: run './Scripts/switch-amplify-env.sh' to sync config"
echo "   - Note: Next.js Turbopack doesn't support symlinks, so we copy the file"
