#!/bin/b#!/bin/bash

# Kill any existing processes on port 3002
echo "Killing any processes on port 3002..."
kill $(lsof -t -i:3002) 2>/dev/null || true

# Check if the Express app already exists
if [ ! -d "/home/botme/arbitrages/express-app" ]; then
    # Create a simple Express app if it doesn't exist
    echo "Creating a simple Express app..."
    mkdir -p /home/botme/arbitrages/express-app
    cd /home/botme/arbitrages/express-app

    # Initialize package.json
    cat > package.json << 'EOF'
{
  "name": "express-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.11.0"
  }
}
EOFting processes on port 3002
echo "Killing any processes on port 3002..."
kill $(lsof -t -i:3002) 2>/dev/null || true

# Check if the Express app already exists
if [ ! -d "/home/botme/arbitrages/express-app" ]; then
    # Create a simple Express app if it doesn't exist
    echo "Creating a simple Express app..."
    mkdir -p /home/botme/arbitrages/express-app
    cd /home/botme/arbitrages/express-app

    # Initialize package.json
    cat > package.json << 'EOF'
{
  "name": "express-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.11.0"
  }
}
EOF

    # Create a simple Express server
    cat > server.js << 'EOF'
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3002;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API route to fetch opportunities from the backend
app.get('/api/opportunities', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/api/opportunities');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching opportunities:', error.message);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// API route to fetch bot status from the backend
app.get('/api/status', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/api/status');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching status:', error.message);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Create public directory
const publicDir = path.join(__dirname, 'public');
if (!require('fs').existsSync(publicDir)) {
  require('fs').mkdirSync(publicDir);
}

// Create a simple HTML file
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Arbitrage Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #0070f3;
    }
    .status-box {
      background-color: #f0f8ff;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .opportunity-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      grid-gap: 15px;
    }
    .opportunity-card {
      background-color: white;
      border: 1px solid #eaeaea;
      border-radius: 4px;
      padding: 15px;
      transition: transform 0.2s;
    }
    .opportunity-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .error {
      color: #d32f2f;
    }
    .success {
      color: #388e3c;
    }
    .no-results {
      text-align: center;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Arbitrum DEX Arbitrage Dashboard</h1>
    
    <div class="status-box">
      <h2>Arbitrage Bot Status</h2>
      <div id="status-container">Loading...</div>
    </div>

    <h2>Current Arbitrage Opportunities</h2>
    <div id="opportunities-container">Loading...</div>
  </div>

  <script>
    // Function to fetch data from the API
    async function fetchData() {
      try {
        // Fetch bot status
        const statusResponse = await fetch('/api/status');
        const statusData = await statusResponse.json();
        
        // Update status container
        const statusContainer = document.getElementById('status-container');
        if (statusData.running) {
          statusContainer.innerHTML = \`
            <p class="success">Bot is running</p>
            <p>Last updated: \${new Date(statusData.lastUpdate).toLocaleTimeString()}</p>
          \`;
        } else {
          statusContainer.innerHTML = \`
            <p class="error">Bot is stopped</p>
          \`;
        }
        
        // Fetch opportunities
        const oppsResponse = await fetch('/api/opportunities');
        const opportunities = await oppsResponse.json();
        
        // Update opportunities container
        const oppsContainer = document.getElementById('opportunities-container');
        
        if (opportunities.length === 0) {
          oppsContainer.innerHTML = \`
            <div class="no-results">
              <p>No arbitrage opportunities found at the moment</p>
              <p>The bot is actively monitoring DEX prices for profitable trades</p>
            </div>
          \`;
        } else {
          oppsContainer.innerHTML = \`
            <div class="opportunity-list">
              \${opportunities.map(opp => \`
                <div class="opportunity-card">
                  <h3>\${opp.pair}</h3>
                  <p><strong>Buy on:</strong> \${opp.buyDEX} at $\${opp.buyPrice.toFixed(6)}</p>
                  <p><strong>Sell on:</strong> \${opp.sellDEX} at $\${opp.sellPrice.toFixed(6)}</p>
                  <p><strong>Price spread:</strong> \${opp.priceSpread.toFixed(2)}%</p>
                  <p><strong>Potential profit:</strong> $\${opp.profit.toFixed(2)} (\${opp.roi.toFixed(2)}%)</p>
                </div>
              \`).join('')}
            </div>
          \`;
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('status-container').innerHTML = \`
          <p class="error">Failed to connect to API server</p>
        \`;
        document.getElementById('opportunities-container').innerHTML = \`
          <p class="error">Failed to fetch data from API server</p>
        \`;
      }
    }

    // Fetch data immediately
    fetchData();
    
    // Then fetch data every 30 seconds
    setInterval(fetchData, 30000);
  </script>
</body>
</html>
`;

require('fs').writeFileSync(path.join(publicDir, 'index.html'), htmlContent);

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Express server running at http://localhost:${port}`);
});
EOF

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the app
echo "Starting Express app on port 3002..."
PORT=3002 node server.js
