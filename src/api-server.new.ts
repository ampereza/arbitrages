import express from 'express';
import cors from 'cors';
import { TokenFetcher } from './TokenFetcher';
import { Token } from './interfaces/GraphTypes';
import { Request, Response } from 'express';
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

// Keep track of opportunities with expiration
const persistentOpportunities = new Map<string, StoredOpportunity>();
const OPPORTUNITY_LIFETIME = 5 * 60 * 1000; // 5 minutes
const OPPORTUNITY_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

// Handler to analyze arbitrage opportunities
async function analyzeOpportunity(req: Request<{}, {}, { baseToken: Token, quoteToken: Token }>, res: Response): Promise<void> {
    try {
        if (!tokenFetcher) {
            res.status(503).json({ success: false, error: 'TokenFetcher not initialized' });
            return;
        }

        const { baseToken, quoteToken } = req.body;
        if (!baseToken?.symbol || !baseToken?.address || !baseToken?.decimals ||
            !quoteToken?.symbol || !quoteToken?.address || !quoteToken?.decimals) {
            res.status(400).json({ success: false, error: 'Invalid token data provided' });
            return;
        }

        const analysis = await tokenFetcher.analyzeArbitrageOpportunity(
            baseToken as Token,
            quoteToken as Token
        );

        if (!analysis?.buyDEX || !analysis?.sellDEX || !analysis?.buyPrice || !analysis?.sellPrice || 
            !analysis?.priceSpread || !analysis?.estimatedROI || !analysis?.tradeSizing?.recommendedAmount) {
            res.status(404).json({ success: false, error: 'No valid arbitrage opportunity found' });
            return;
        }

        const opportunity: StoredOpportunity = {
            id: `${baseToken.symbol}-${quoteToken.symbol}`,
            pair: `${baseToken.symbol}/${quoteToken.symbol}`,
            buyDEX: analysis.buyDEX,
            sellDEX: analysis.sellDEX,
            buyPrice: analysis.buyPrice,
            sellPrice: analysis.sellPrice,
            priceSpread: analysis.priceSpread,
            profit: analysis.profitAnalysis?.netProfit ?? 0,
            roi: analysis.estimatedROI,
            recommendedAmount: analysis.tradeSizing.recommendedAmount,
            investment: analysis.tradeSizing.recommendedAmount * analysis.buyPrice,
            riskFactors: analysis.riskFactors || [],
            timestamp: Date.now(),
            expiresAt: Date.now() + OPPORTUNITY_LIFETIME,
            lastUpdated: Date.now()
        };

        // Store the opportunity
        persistentOpportunities.set(opportunity.id, opportunity);
        
        res.json({
            success: true,
            opportunity
        });
    } catch (error) {
        console.error('Error analyzing arbitrage opportunity:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

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
app.get('/api/status', (_req: Request, res: Response) => {
    res.json(botStatus);
});

app.get('/api/opportunities', (_req: Request, res: Response) => {
    res.json(getCurrentOpportunities());
});

app.post('/api/analyze', analyzeOpportunity);

app.post('/api/bot/start', (_req: Request, res: Response) => {
    botStatus.running = true;
    botStatus.lastUpdate = Date.now();
    console.log('🚀 Bot started via API');
    res.json({ success: true, message: 'Bot started' });
});

app.post('/api/bot/stop', (_req: Request, res: Response) => {
    botStatus.running = false;
    botStatus.lastUpdate = Date.now();
    console.log('🛑 Bot stopped via API');
    res.json({ success: true, message: 'Bot stopped' });
});

app.post('/api/opportunities/execute', (req: Request, res: Response) => {
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

// Background scanner function
async function findOpportunities(): Promise<void> {
    if (!botStatus.running) return;
    
    try {
        console.log('🔍 Scanning for arbitrage opportunities...');
        
        if (!tokenFetcher) {
            // Demo mode - create fake opportunities
            const demoOpportunity: StoredOpportunity = {
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
        
        // Get some trading pairs - reduced to just 1 pair to prevent rate limiting
        const pairs = await tokenFetcher.generateTradingPairs();
        const randomPairs = pairs.slice(0, 1); // Check only 1 pair per cycle
        
        let foundOpportunities = 0;
        
        for (const pair of randomPairs) {
            try {
                // Add larger delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
                
                const analysis = await tokenFetcher.analyzeArbitrageOpportunity(
                    pair.baseToken,
                    pair.quoteToken
                );

                if (!analysis?.buyDEX || !analysis?.sellDEX || !analysis?.buyPrice || !analysis?.sellPrice || 
                    !analysis?.priceSpread || !analysis?.estimatedROI || !analysis?.tradeSizing?.recommendedAmount) {
                    console.log(`No valid arbitrage opportunity found for ${pair.baseToken.symbol}/${pair.quoteToken.symbol}`);
                    continue;
                }

                const opportunityId = `${pair.baseToken.symbol}-${pair.quoteToken.symbol}`;
                const opportunity: StoredOpportunity = {
                    id: opportunityId,
                    pair: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,
                    buyDEX: analysis.buyDEX,
                    sellDEX: analysis.sellDEX,
                    buyPrice: analysis.buyPrice,
                    sellPrice: analysis.sellPrice,
                    priceSpread: analysis.priceSpread,
                    profit: analysis.profitAnalysis?.netProfit ?? 0,
                    roi: analysis.estimatedROI,
                    recommendedAmount: analysis.tradeSizing.recommendedAmount,
                    investment: analysis.tradeSizing.recommendedAmount * analysis.buyPrice,
                    riskFactors: analysis.riskFactors || [],
                    timestamp: Date.now(),
                    expiresAt: Date.now() + OPPORTUNITY_LIFETIME,
                    lastUpdated: Date.now()
                };
                
                // Add or update opportunity in persistent storage
                const wasExisting = persistentOpportunities.has(opportunity.id);
                persistentOpportunities.set(opportunity.id, opportunity);
                foundOpportunities++;
                
                if (wasExisting) {
                    console.log(`🔄 Updated opportunity: ${opportunity.pair} (${opportunity.priceSpread.toFixed(2)}% spread)`);
                } else {
                    console.log(`🆕 New opportunity: ${opportunity.pair} (${opportunity.priceSpread.toFixed(2)}% spread)`);
                }
            } catch (error) {
                console.error(`Error analyzing ${pair.baseToken.symbol}/${pair.quoteToken.symbol}:`, error);
            }
        }
        
        botStatus.lastUpdate = Date.now();
        
        if (foundOpportunities > 0) {
            console.log(`✅ Found ${foundOpportunities} new arbitrage opportunities`);
            console.log(`📊 Total persistent opportunities: ${persistentOpportunities.size}`);
        } else {
            console.log('❌ No new profitable opportunities found');
        }
        
    } catch (error: any) {
        if (error?.message?.includes('Too Many Requests') || error?.code === 'BAD_DATA') {
            console.warn('⚠️ Rate limit detected - pausing scanning for 5 minutes');
            setTimeout(() => {
                console.log('🔄 Resuming after rate limit cooldown');
            }, 300000); // 5 minute pause
            return;
        }
        
        console.error('Error in opportunity scanning:', error);
    }
}

// Start background scanning for opportunities
setInterval(findOpportunities, OPPORTUNITY_REFRESH_INTERVAL);

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
    
    // Start the opportunity scanner
    findOpportunities().catch(error => {
        console.error('Error in initial opportunity scan:', error);
    });
});
