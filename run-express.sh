#!/bin/bash

# Kill any existing processes on port 3002
echo "Killing any processes on port 3002..."
kill $(lsof -t -i:3002) 2>/dev/null || true

# Go to the Express app directory
cd /home/botme/arbitrages/express-app

# Check if the server is already installed
if [ ! -f "server.js" ]; then
    echo "Error: Express app not found. Run start-express.sh first to create it."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the server
echo "Starting Express app on port 3002..."
node server.js
