#!/bin/bash
# Generate documentation for the RPC Worker Pool service

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Generating documentation for RPC Worker Pool...${NC}"

# Create docs directory if it doesn't exist
mkdir -p docs/generated

# Print package manager policy
echo -e "${YELLOW}IMPORTANT: Package Manager Policy${NC}"
echo -e "${YELLOW}- Inside monorepo-one: Use ONLY Rush commands (rush add -m -p, rush update)${NC}"
echo -e "${YELLOW}- Outside monorepo-one: Use ONLY pnpm/pnpx commands (pnpm add, pnpx)${NC}"
echo -e "${YELLOW}- NEVER use npm, yarn, or npx anywhere${NC}"
echo -e "${YELLOW}- NEVER use pnpm directly inside monorepo-one when a rush command exists for the same purpose${NC}"
echo ""

# Generate TypeDoc documentation
if command -v pnpx &> /dev/null
then
    echo "Generating TypeDoc documentation..."
    pnpx typedoc --out docs/generated/api src/
    echo -e "${GREEN}TypeDoc documentation generated successfully!${NC}"
else
    echo -e "${RED}Error: TypeDoc not available. Install TypeDoc with 'rush add -p typedoc'.${NC}"
fi

echo -e "\n${BLUE}Documentation generation completed.${NC}"
echo "Generated documentation is available in the docs/generated directory."
