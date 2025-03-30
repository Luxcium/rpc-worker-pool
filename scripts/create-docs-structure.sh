#!/bin/bash
# Creates the documentation directory structure for the RPC Worker Pool service

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Creating documentation directory structure...${NC}"

# Create main docs directory and subdirectories
mkdir -p docs/public
mkdir -p docs/internal
mkdir -p docs/generated

# Create placeholder files
touch docs/public/api-reference.md
touch docs/public/usage-examples.md
touch docs/internal/architecture.md
touch docs/internal/design-decisions.md

echo -e "${GREEN}Documentation directory structure created successfully!${NC}"
echo "The following structure has been created:"
echo "docs/"
echo "├── public/"
echo "│   ├── api-reference.md"
echo "│   └── usage-examples.md"
echo "├── internal/"
echo "│   ├── architecture.md"
echo "│   └── design-decisions.md"
echo "└── generated/ (for automated doc generation)"

echo -e "\n${BLUE}Remember to update the README.md file with basic service information.${NC}"
