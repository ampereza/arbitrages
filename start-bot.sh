#!/bin/bash

set -e  # Exit on any error
set -x  # Print each command before executing

echo "Starting Arbitrage Bot..."
cd /home/botme/arbitrages

# Build the project
npm run build

# Export environment variables
export PROVIDER_URL=https://arb1.arbitrum.io/rpc
export NODE_TLS_REJECT_UNAUTHORIZED=0  # Allow self-signed certs for development
export HTTPS_PROXY=   # Clear any proxy settings that might interfere
export HTTP_PROXY=
export NO_PROXY=localhost,127.0.0.1

echo "🚀 Starting arbitrage bot..."
# Run the bot with increased memory limit for better performance
node --max-old-space-size=4096 dist/index.js
