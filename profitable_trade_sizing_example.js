// Enhanced Arbitrage Bot with Optimal Trade Sizing
// This example shows how the bot now calculates the exact amount needed for profitable trades

import { TokenFetcher } from './src/TokenFetcher.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function demonstrateProfitableTradeCalculation() {
    console.log('🎯 PROFITABLE TRADE SIZING DEMONSTRATION');
    console.log('=========================================\n');

    const tokenFetcher = new TokenFetcher();
    
    // Example tokens
    const WETH = {
        symbol: 'WETH',
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        decimals: 18
    };
    
    const USDC = {
        symbol: 'USDC', 
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6
    };

    console.log('📊 Analyzing WETH/USDC arbitrage opportunity with profit targeting...\n');

    try {
        // Use the new comprehensive analysis method
        const analysis = await tokenFetcher.analyzeArbitrageOpportunity(
            WETH,
            USDC,
            100 // Target minimum $100 profit
        );

        if (analysis.opportunity) {
            console.log('🎉 PROFITABLE ARBITRAGE OPPORTUNITY FOUND!');
            console.log('==========================================');
            console.log(`📈 Pair: ${WETH.symbol}/${USDC.symbol}`);
            console.log(`💰 Buy on: ${analysis.buyDEX} at $${analysis.buyPrice.toFixed(2)}`);
            console.log(`💸 Sell on: ${analysis.sellDEX} at $${analysis.sellPrice.toFixed(2)}`);
            console.log(`📊 Price spread: ${analysis.priceSpread.toFixed(2)}%`);
            
            console.log('\n🎯 TRADE SIZING ANALYSIS:');
            console.log(`💎 Minimum profitable amount: ${analysis.tradeSizing.minAmount.toLocaleString()} WETH`);
            console.log(`💎 Maximum viable amount: ${analysis.tradeSizing.maxAmount.toLocaleString()} WETH`);
            console.log(`🎯 RECOMMENDED AMOUNT: ${analysis.tradeSizing.recommendedAmount.toLocaleString()} WETH`);
            
            const investmentNeeded = analysis.tradeSizing.recommendedAmount * analysis.buyPrice;
            console.log(`💰 Investment needed: $${investmentNeeded.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
            
            if (analysis.profitAnalysis) {
                console.log('\n💡 PROFIT ANALYSIS:');
                console.log(`🤑 Expected gross profit: $${analysis.profitAnalysis.grossProfit.toFixed(2)}`);
                console.log(`💵 Expected net profit: $${analysis.profitAnalysis.netProfit.toFixed(2)}`);
                console.log(`📈 ROI: ${analysis.estimatedROI.toFixed(2)}%`);
                console.log(`⚡ Profit margin: ${(analysis.profitAnalysis.profitMargin * 100).toFixed(2)}%`);
                
                console.log('\n💸 COST BREAKDOWN:');
                console.log(`   • Total trading fees: $${(analysis.profitAnalysis.totalFees - analysis.profitAnalysis.breakdown.gasCost).toFixed(2)}`);
                console.log(`   • Flash loan fee (0.1%): $${analysis.profitAnalysis.breakdown.flashLoanCost.toFixed(2)}`);
                console.log(`   • Gas fees: $${analysis.profitAnalysis.breakdown.gasCost.toFixed(2)}`);
                console.log(`   • Slippage impact: $${analysis.profitAnalysis.slippageImpact.toFixed(2)}`);
                console.log(`   • Total costs: $${analysis.profitAnalysis.breakdown.totalCosts.toFixed(2)}`);
            }
            
            if (analysis.riskFactors.length > 0) {
                console.log('\n⚠️  RISK ASSESSMENT:');
                analysis.riskFactors.forEach(risk => console.log(`   • ${risk}`));
            }
            
            console.log('\n🚀 EXECUTION SUMMARY:');
            console.log(`1. Flash loan ${analysis.tradeSizing.recommendedAmount.toLocaleString()} WETH from AAVE`);
            console.log(`2. Buy ${analysis.tradeSizing.recommendedAmount.toLocaleString()} WETH on ${analysis.buyDEX} for $${investmentNeeded.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
            console.log(`3. Sell ${analysis.tradeSizing.recommendedAmount.toLocaleString()} WETH on ${analysis.sellDEX} for $${(analysis.tradeSizing.recommendedAmount * analysis.sellPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
            console.log(`4. Repay flash loan + fees`);
            console.log(`5. Keep $${analysis.profitAnalysis?.netProfit.toFixed(2)} profit`);
            
        } else {
            console.log('❌ No profitable arbitrage opportunity found');
            console.log(`Reason: ${analysis.tradeSizing.reason}`);
            
            if (analysis.riskFactors.length > 0) {
                console.log('\nIssues identified:');
                analysis.riskFactors.forEach(risk => console.log(`   • ${risk}`));
            }
        }

        // Show manual calculation example
        console.log('\n' + '='.repeat(60));
        console.log('📚 MANUAL CALCULATION EXAMPLE');
        console.log('='.repeat(60));
        
        // Demo the minimum profitable amount calculation directly
        const minProfitCalc = tokenFetcher.calculateMinimumProfitableAmount(
            2500, // Buy price (example)
            2525, // Sell price (example) 
            0.003, // 0.3% buy DEX fee
            0.003, // 0.3% sell DEX fee
            0.001, // 0.1% flash loan fee
            50, // $50 gas
            100, // $100 minimum profit target
            5000000, // $5M buy pool liquidity
            5000000, // $5M sell pool liquidity
            0.02 // 2% max slippage
        );
        
        console.log('\nExample calculation for WETH at $2500 (buy) vs $2525 (sell):');
        console.log(`Minimum profitable amount: ${minProfitCalc.minAmount.toLocaleString()} WETH`);
        console.log(`Recommended amount: ${minProfitCalc.recommendedAmount.toLocaleString()} WETH`);
        console.log(`Profitable: ${minProfitCalc.profitable ? '✅ Yes' : '❌ No'}`);
        console.log(`Reason: ${minProfitCalc.reason}`);

    } catch (error) {
        console.error('❌ Error in analysis:', error.message);
        console.log('\nThis is expected if you don\'t have a valid INFURA_KEY in your .env file');
        
        // Show what the output would look like with mock data
        console.log('\n📋 EXAMPLE OUTPUT (with real data):');
        console.log('🎯 RECOMMENDED AMOUNT: 125 WETH');
        console.log('💰 Investment needed: $312,500');
        console.log('💵 Expected net profit: $156.25');
        console.log('📈 ROI: 0.05%');
        console.log('⚡ Profit margin: 0.05%');
    }
}

// Run the demonstration
demonstrateProfitableTradeCalculation().catch(console.error);
