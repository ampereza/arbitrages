import { ArbitrageBot } from './src/ArbitrageBot';
import * as dotenv from 'dotenv';

dotenv.config();

async function testProfitAnalysis() {
    console.log('🧪 Testing Detailed Profit Analysis with All Costs...');
    console.log('='.repeat(60));
    
    const bot = new ArbitrageBot();
    
    try {
        // Initialize and get opportunities
        const opportunities = await new Promise<any[]>((resolve) => {
            let results: any[] = [];
            const originalLog = console.log;
            
            // Capture opportunities from console output
            console.log = (...args) => {
                const message = args.join(' ');
                if (message.includes('Found') && message.includes('PROFITABLE arbitrage')) {
                    // Extract number from message like "Found 3 PROFITABLE arbitrage opportunities:"
                    const match = message.match(/Found (\d+) PROFITABLE arbitrage/);
                    if (match) {
                        // We'll simulate some opportunities for testing
                        results = [
                            {
                                tokenIn: { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
                                tokenOut: { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
                                buyDEX: 'SUSHISWAP',
                                sellDEX: 'UNISWAPV3',
                                buyPrice: 3219,
                                sellPrice: 3479,
                                priceSpread: 7.76,
                                estimatedROI: 0.0635,
                                profitAnalysis: {
                                    netProfit: 63.51,
                                    grossProfit: 260,
                                    gasCost: 0.02
                                },
                                tradeSizing: {
                                    recommendedAmount: 50000,
                                    maxAmount: 100000,
                                    minAmount: 1000
                                },
                                riskFactors: ['Liquidity risk'],
                                timestamp: Date.now()
                            }
                        ];
                        setTimeout(() => resolve(results), 1000);
                    }
                }
                originalLog(...args);
            };
            
            setTimeout(() => {
                console.log = originalLog;
                if (results.length === 0) {
                    resolve([]);
                }
            }, 15000);
        });
        
        // Test detailed profit analysis for different trade sizes
        if (opportunities.length > 0) {
            const bestOpp = opportunities[0];
            console.log('\n📊 DETAILED PROFIT ANALYSIS');
            console.log('='.repeat(60));
            
            const tradeSizes = [500, 1000, 5000, 10000, 25000];
            
            for (const tradeSize of tradeSizes) {
                console.log(`\n💰 Trade Size: $${tradeSize.toLocaleString()}`);
                console.log('-'.repeat(40));
                
                try {
                    const analysis = await bot.getDetailedProfitAnalysis(bestOpp, tradeSize);
                    console.log(analysis);
                } catch (error) {
                    console.error(`Error analyzing $${tradeSize}: ${error}`);
                }
            }
            
        } else {
            console.log('\n❌ No opportunities found for detailed analysis');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
    
    process.exit(0);
}

// Run the test
testProfitAnalysis().catch(console.error);
