import express from 'express';
import cors from 'cors';
import { TokenFetcher } from './TokenFetcher.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize the arbitrage bot (only if we have required env vars)
let tokenFetcher: TokenFetcher | null = null;
try {
  tokenFetcher = new TokenFetcher();
} catch (error: any) {
  console.warn('⚠️  TokenFetcher initialization failed - running in demo mode:', error.message);
}

// Bot status
// Global state
let botStatus = {
  running: false,
  lastUpdate: 0,
  totalTrades: 0,
  successRate: 85,
  todayProfit: 0
};

// Store opportunities with expiration tracking
interface StoredOpportunity {
  id: string;
  pair: string;
  buyDEX: string;
  sellDEX: string;
  buyPrice: number;
  sellPrice: number;
  priceSpread: number;
  profit: number;
  roi: number;
  recommendedAmount: number;
  investment: number;
  riskFactors: string[];
  timestamp: number;
  expiresAt: number;  // When this opportunity should be considered stale
  lastUpdated: number; // Last time we verified this opportunity
}

let persistentOpportunities = new Map<string, StoredOpportunity>();
const OPPORTUNITY_LIFETIME = 5 * 60 * 1000; // 5 minutes
const OPPORTUNITY_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

// Get current opportunities - clean up expired ones first
function getCurrentOpportunities(): StoredOpportunity[] {
  const now = Date.now();
  
  // Remove expired opportunities
  for (const [id, opportunity] of persistentOpportunities.entries()) {
    if (opportunity.expiresAt < now) {
      console.log(`🗑️ Removing expired opportunity: ${opportunity.pair}`);
      persistentOpportunities.delete(id);
    }
  }
  
  return Array.from(persistentOpportunities.values())
    .sort((a, b) => b.roi - a.roi); // Sort by ROI descending
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json(botStatus);
});

app.get('/api/opportunities', (req, res) => {
  res.json(getCurrentOpportunities());
});

app.post('/api/bot/start', (req, res) => {
  botStatus.running = true;
  botStatus.lastUpdate = Date.now();
  console.log('🚀 Bot started via API');
  res.json({ success: true, message: 'Bot started' });
});

app.post('/api/bot/stop', (req, res) => {
  botStatus.running = false;
  botStatus.lastUpdate = Date.now();
  console.log('🛑 Bot stopped via API');
  res.json({ success: true, message: 'Bot stopped' });
});

app.post('/api/opportunities/execute', (req, res) => {
  const { opportunityId } = req.body;
  console.log(`🎯 Executing opportunity ${opportunityId}`);
  
  // Simulate trade execution
  setTimeout(() => {
    botStatus.totalTrades++;
    botStatus.successRate = Math.min(95, botStatus.successRate + 1);
    botStatus.todayProfit += Math.random() * 200; // Random profit for demo
    botStatus.lastUpdate = Date.now();
  }, 1000);
  
  res.json({ success: true, message: 'Trade execution initiated' });
});

// Simulate finding arbitrage opportunities
async function findOpportunities() {
  if (!botStatus.running) return;
  
  try {
    console.log('🔍 Scanning for arbitrage opportunities...');
    
    if (!tokenFetcher) {
      // Demo mode - create fake opportunities
      const demoOpportunity = {
        id: `DEMO-${Date.now()}`,
        pair: 'UNI/WETH',
        buyDEX: 'Uniswap V2',
        sellDEX: 'Sushiswap',
        buyPrice: 0.002713,
        sellPrice: 0.002891,
        priceSpread: 6.56,
        profit: 127.45,
        roi: 12.3,
        recommendedAmount: 5000,
        investment: 1035.65,
        riskFactors: ['Demo mode - not real data'],
        timestamp: Date.now(),
        expiresAt: Date.now() + OPPORTUNITY_LIFETIME,
        lastUpdated: Date.now()
      };
      
      // Add demo opportunity to persistent storage
      persistentOpportunities.set(demoOpportunity.id, demoOpportunity);
      botStatus.lastUpdate = Date.now();
      console.log('📊 Demo mode: Created sample opportunity');
      return;
    }
    
    // Get some trading pairs
    const pairs = await tokenFetcher.generateTradingPairs();
    const randomPairs = pairs.slice(0, 3); // Check first 3 pairs for demo
    
    const opportunities = [];
    
    for (const pair of randomPairs) {
      try {
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2000ms delay (2 seconds)
        
        const analysis = await tokenFetcher.analyzeArbitrageOpportunity(
          pair.baseToken,
          pair.quoteToken,
          100 // $100 minimum profit
        );
        
        if (analysis.opportunity) {
          const opportunityId = `${pair.baseToken.symbol}-${pair.quoteToken.symbol}`;
          const opportunity: StoredOpportunity = {
            id: opportunityId,
            pair: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,
            buyDEX: analysis.buyDEX,
            sellDEX: analysis.sellDEX,
            buyPrice: analysis.buyPrice,
            sellPrice: analysis.sellPrice,
            priceSpread: analysis.priceSpread,
            profit: analysis.profitAnalysis?.netProfit || 0,
            roi: analysis.estimatedROI,
            recommendedAmount: analysis.tradeSizing.recommendedAmount,
            investment: analysis.tradeSizing.recommendedAmount * analysis.buyPrice,
            riskFactors: analysis.riskFactors,
            timestamp: persistentOpportunities.has(opportunityId) ? 
              persistentOpportunities.get(opportunityId)!.timestamp : Date.now(), // Keep original timestamp if updating
            expiresAt: Date.now() + OPPORTUNITY_LIFETIME,
            lastUpdated: Date.now()
          };
          
          // Add or update opportunity in persistent storage
          const wasExisting = persistentOpportunities.has(opportunityId);
          persistentOpportunities.set(opportunityId, opportunity);
          opportunities.push(opportunity);
          
          if (wasExisting) {
            console.log(`🔄 Updated opportunity: ${opportunity.pair} (${opportunity.priceSpread.toFixed(2)}% spread)`);
          } else {
            console.log(`🆕 New opportunity: ${opportunity.pair} (${opportunity.priceSpread.toFixed(2)}% spread)`);
          }
        }
      } catch (error) {
        console.debug(`Error analyzing ${pair.baseToken.symbol}/${pair.quoteToken.symbol}:`, error);
      }
    }
    
    botStatus.lastUpdate = Date.now();
    
    if (opportunities.length > 0) {
      console.log(`✅ Found ${opportunities.length} new arbitrage opportunities`);
      console.log(`📊 Total persistent opportunities: ${persistentOpportunities.size}`);
    } else {
      console.log('❌ No new profitable opportunities found');
    }
    
  } catch (error) {
    console.error('Error in opportunity scanning:', error);
  }
}

// Start the opportunity scanner
setInterval(findOpportunities, 30000); // Check every 30 seconds

app.listen(port, () => {
  console.log(`🌐 API server running on port ${port}`);
  console.log(`📊 Dashboard will be available at: http://localhost:3000`);
});
