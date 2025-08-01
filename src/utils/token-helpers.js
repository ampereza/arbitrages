// Helper function to get the active token pairs on Arbitrum
const fs = require('fs');
const path = require('path');

function getArbitrumActiveTokens() {
  try {
    // Read the active pairs file we generated
    const activeTokensPath = path.join(__dirname, '../arbitrum-active-pairs.json');
    if (!fs.existsSync(activeTokensPath)) {
      console.warn('⚠️ No active tokens file found, using default tokens');
      return null;
    }

    const activeTokensData = fs.readFileSync(activeTokensPath, 'utf8');
    const activePairs = JSON.parse(activeTokensData);

    // Extract unique tokens from the active pairs
    const activeTokens = new Set();
    for (const pair of activePairs) {
      activeTokens.add(pair.token0.address.toLowerCase());
      activeTokens.add(pair.token1.address.toLowerCase());
    }

    console.log(`✅ Loaded ${activeTokens.size} active tokens from ${activePairs.length} pairs`);
    return Array.from(activeTokens);
  } catch (error) {
    console.error('❌ Error loading active tokens:', error.message);
    return null;
  }
}

module.exports = {
  getArbitrumActiveTokens,
};
