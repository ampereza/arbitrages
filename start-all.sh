#!/bin/bash

set -e  # Exit on any error
set -x  # Print each command before executing

# Kill any existing processes on these ports
echo "Killing any processes on ports 3001 and 3002..."
kill $(lsof -t -i:3001) 2>/dev/null || true
kill $(lsof -t -i:3002) 2>/dev/null || true

# Start API server in the background
echo "Starting API server on port 3001..."
cd /home/botme/arbitrages
npm run build
node dist/api-server.js &
API_PID=$!
echo "API server started with PID: $API_PID"

# Wait to ensure API server is up
echo "Waiting for API server to start..."
sleep 5

# Test if API is responding
curl -s http://localhost:3001/api/health || echo "Warning: API server not responding on port 3001"

echo "✅ API server is running on port 3001"
echo "API server will continue running..."

# Keep the API server running
wait $API_PID

# Kill the API server when this script ends
trap "echo 'Shutting down API server...'; kill $API_PID 2>/dev/null || true" EXIT
