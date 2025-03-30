#!/bin/bash
# filepath: /projects/monorepo-one/services/rpc-worker-pool/src/base/test-client.sh

echo "Testing helloWorld command..."
curl -s "http://localhost:8010/helloWorld/RPC/Worker/Pool"
echo -e "\n"

echo "Testing echo command..."
curl -s "http://localhost:8010/echo/param1/param2/param3"
echo -e "\n"

echo "Tests completed!"
