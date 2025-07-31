#!/bin/bash

echo "🚀 Preparing Arbitrage Bot for Render Deployment..."

# Build the TypeScript backend
echo "📦 Building backend..."
npm run build

# Test that the build works
echo "🧪 Testing backend build..."
if [ ! -f "dist/api-server.js" ]; then
    echo "❌ Backend build failed - dist/api-server.js not found"
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
cd src/frontend
npm run build
cd ../..

# Test that the frontend build works
echo "🧪 Testing frontend build..."
if [ ! -d "src/frontend/.next" ]; then
    echo "❌ Frontend build failed - .next directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Push your code to GitHub"
echo "2. Go to render.com and create a new Blueprint"
echo "3. Connect your GitHub repository"
echo "4. Add your INFURA_KEY as a secret environment variable"
echo "5. Deploy!"
echo ""
echo "🌐 Your services will be available at:"
echo "   API: https://arbitrage-bot-api.onrender.com"
echo "   Dashboard: https://arbitrage-bot-frontend.onrender.com"
