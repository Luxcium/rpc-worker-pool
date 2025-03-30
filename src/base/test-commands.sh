#!/bin/bash
# Simple script to test RPC worker pool commands

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define server information
HOST="localhost"
PORT="8010"

echo -e "${BLUE}===== RPC Worker Pool Command Tester =====${NC}"
echo ""

# Function to send a request and display the result
send_request() {
  local command=$1
  shift
  local params=("$@")

  echo -e "${BLUE}Testing command:${NC} ${command}"
  echo -e "${BLUE}Parameters:${NC} ${params[*]:-none}"

  # Build the URL
  local url="http://${HOST}:${PORT}/${command}"
  if [ ${#params[@]} -gt 0 ]; then
    url="${url}/${params[*]// //}"
  fi

  echo -e "${BLUE}URL:${NC} ${url}"
  echo ""

  # Send the request
  response=$(curl -s "$url")

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Response:${NC}"
    echo "$response" | jq . || echo "$response"
  else
    echo -e "${RED}Error:${NC} Failed to connect to server"
  fi
  echo ""
  echo "----------------------------------------"
  echo ""
}

# Test various commands
send_request "helloWorld" "RPC" "Worker" "Pool"
send_request "echo" "testing" "echo" "command"
send_request "status"
send_request "info"

echo -e "${GREEN}All tests complete!${NC}"
