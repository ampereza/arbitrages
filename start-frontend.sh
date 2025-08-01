#!/bin/bash

# Kill any existing processes on port 3002
echo "Killing any processes on port 3002..."
kill $(lsof -t -i:3002) 2>/dev/null || true

# Make sure the log directory exists
mkdir -p /home/botme/arbitrages/logs

# Create a minimal Next.js page to test with
echo "Creating a minimal test page..."
mkdir -p /home/botme/arbitrages/src/frontend/src/pages
cat > /home/botme/arbitrages/src/frontend/src/pages/test.js << 'EOF'
export default function Test() {
  return (
    <div>
      <h1>Test Page</h1>
      <p>If you can see this, Next.js is working!</p>
    </div>
  )
}
EOF

# Start frontend with very basic setup
echo "Starting frontend on port 3002..."
cd /home/botme/arbitrages/src/frontend

# Clean any cached files that might be causing issues
echo "Cleaning Next.js cache..."
rm -rf .next node_modules/.cache

# Run with basic configuration and redirect output to log file
echo "Starting Next.js server..."
PORT=3002 HOST=0.0.0.0 npm run dev > /home/botme/arbitrages/logs/frontend.log 2>&1
