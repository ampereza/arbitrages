#!/bin/bash

# Clean up existing processes
echo "Killing any processes on port 3002..."
kill $(lsof -t -i:3002) 2>/dev/null || true

# Create a fresh minimal Next.js app
echo "Creating a minimal Next.js app..."
mkdir -p /home/botme/arbitrages/test-app
cd /home/botme/arbitrages/test-app

# Initialize package.json
cat > package.json << 'EOF'
{
  "name": "test-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "13.4.19",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}
EOF

# Create a simple page
mkdir -p pages
cat > pages/index.js << 'EOF'
export default function Home() {
  return (
    <div>
      <h1>Hello World</h1>
      <p>This is a test page</p>
    </div>
  )
}
EOF

# Create next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
}
EOF

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the app
echo "Starting Next.js app on port 3002..."
PORT=3002 npm run dev
