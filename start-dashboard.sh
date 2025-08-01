#!/bin/bash

set -e  # Exit on any error

# Kill any existing processes on these ports
echo "Killing any processes on ports 3001 and 3002..."
kill $(lsof -t -i:3001) 2>/dev/null || true
kill $(lsof -t -i:3002) 2>/dev/null || true

# Start API server in the background
echo "Starting API server on port 3001..."
cd /home/botme/arbitrages

# Build TypeScript files
npm run build

# Export environment variables to use public RPC
export PROVIDER_URL=https://arb1.arbitrum.io/rpc
export PORT=3001

# Start API server in the background
node dist/api-server.js &
API_PID=$!
echo "API server started with PID: $API_PID"

# Wait to ensure API server is up
echo "Waiting for API server to start..."
sleep 3

# Test if API is responding
if curl -s http://localhost:3001/api/health > /dev/null; then
  echo "✅ API server is running correctly on port 3001"
else
  echo "⚠️ Warning: API server not responding on port 3001"
fi

# Start Express frontend
echo "Starting Express frontend on port 3002..."
cd /home/botme/arbitrages/express-app

# Make sure dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "Installing Express frontend dependencies..."
  npm install --no-fund --no-audit
fi

# Start the Express server
PORT=3002 node server.js &
FRONTEND_PID=$!
echo "Express frontend started with PID: $FRONTEND_PID"

# Wait to ensure frontend is up
echo "Waiting for frontend server to start..."
sleep 2

# Test if frontend is responding
if curl -s http://localhost:3002 > /dev/null; then
  echo "✅ Frontend server is running correctly on port 3002"
  echo "🌐 Open http://localhost:3002 in your browser to view the dashboard"
else
  echo "⚠️ Warning: Frontend server not responding on port 3002"
fi

# Handle graceful shutdown
function cleanup() {
  echo "Shutting down servers..."
  kill $FRONTEND_PID 2>/dev/null || true
  kill $API_PID 2>/dev/null || true
  echo "Servers stopped"
}

trap cleanup EXIT

# Keep the script running to maintain the background processes
echo "Press Ctrl+C to stop both servers"
wait
