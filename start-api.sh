#!/bin/bash

set -e  # Exit on any error
set -x  # Print each command before executing

# Kill any existing processes on port 3001
echo "Killing any processes on port 3001..."
kill $(lsof -t -i:3001) 2>/dev/null || true

# Start API server with environment variables
echo "Starting API server on port 3001..."
cd /home/botme/arbitrages
npm run build

# Export environment variables
export PROVIDER_URL=https://arb1.arbitrum.io/rpc
export PORT=3001
export NODE_TLS_REJECT_UNAUTHORIZED=0  # Allow self-signed certs for development
export HTTPS_PROXY=   # Clear any proxy settings that might interfere
export HTTP_PROXY=
export NO_PROXY=localhost,127.0.0.1

# Run the server with increased memory limit for better performance
node --max-old-space-size=4096 dist/api-server.js
